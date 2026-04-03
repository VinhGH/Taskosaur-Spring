import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role, ProjectStatus, ProjectPriority, ProjectVisibility, TaskPriority, TaskType } from '@prisma/client';
import { GlobalSearchDto, AdvancedSearchDto } from './../src/modules/search/dto/search.dto';
import { hasRequiredRole } from './../src/constants/roles';

describe('SearchController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  let user: any;
  let otherUser: any;
  let memberUser: any;
  let viewerUser: any;
  let accessToken: string;
  let otherAccessToken: string;
  let memberAccessToken: string;
  let viewerAccessToken: string;
  let organizationId: string;
  let otherOrganizationId: string;
  let workspaceId: string;
  let projectId: string;
  let otherProjectId: string;
  let workflowId: string;
  let statusId: string;
  let taskId: string;
  let otherTaskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create a primary test user
    user = await prismaService.user.create({
      data: {
        email: `search-test-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Search',
        lastName: 'Tester',
        username: `search_tester_${Date.now()}`,
        role: Role.OWNER,
      },
    });

    // Generate token for primary user
    accessToken = jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    // Create another test user for cross-tenant testing
    otherUser = await prismaService.user.create({
      data: {
        email: `other-test-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Other',
        lastName: 'Tester',
        username: `other_tester_${Date.now()}`,
        role: Role.OWNER,
      },
    });

    // Generate token for other user
    otherAccessToken = jwtService.sign({ sub: otherUser.id, email: otherUser.email, role: otherUser.role });

    // Create a MEMBER role user for testing role-based filtering
    memberUser = await prismaService.user.create({
      data: {
        email: `member-test-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Member',
        lastName: 'User',
        username: `member_user_${Date.now()}`,
        role: Role.MEMBER,
      },
    });
    memberAccessToken = jwtService.sign({ sub: memberUser.id, email: memberUser.email, role: memberUser.role });

    // Create a VIEWER role user for testing role-based filtering
    viewerUser = await prismaService.user.create({
      data: {
        email: `viewer-test-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Viewer',
        lastName: 'User',
        username: `viewer_user_${Date.now()}`,
        role: Role.VIEWER,
      },
    });
    viewerAccessToken = jwtService.sign({ sub: viewerUser.id, email: viewerUser.email, role: viewerUser.role });

    // Create Organization for primary user
    const organization = await prismaService.organization.create({
      data: {
        name: `Search Org ${Date.now()}`,
        slug: `search-org-${Date.now()}`,
        ownerId: user.id,
        members: {
          create: [
            {
              userId: user.id,
              role: Role.OWNER,
            },
            {
              userId: memberUser.id,
              role: Role.MEMBER,
            },
            {
              userId: viewerUser.id,
              role: Role.VIEWER,
            },
          ],
        },
      },
    });
    organizationId = organization.id;

    // Create Organization for other user
    const otherOrganization = await prismaService.organization.create({
      data: {
        name: `Other Org ${Date.now()}`,
        slug: `other-org-${Date.now()}`,
        ownerId: otherUser.id,
        members: {
          create: {
            userId: otherUser.id,
            role: Role.OWNER,
          },
        },
      },
    });
    otherOrganizationId = otherOrganization.id;

    // Create Workflow
    const workflow = await prismaService.workflow.create({
      data: {
        name: 'Search Workflow',
        organizationId: organization.id,
        isDefault: true,
      },
    });
    workflowId = workflow.id;

    // Create Workspace
    const workspace = await prismaService.workspace.create({
      data: {
        name: `Search Workspace ${Date.now()}`,
        slug: `search-workspace-${Date.now()}`,
        organizationId: organization.id,
      },
    });
    workspaceId = workspace.id;

    // Create Project for primary user
    const project = await prismaService.project.create({
      data: {
        name: 'Search Project',
        slug: `search-project-${Date.now()}`,
        workspaceId: workspace.id,
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        visibility: ProjectVisibility.PRIVATE,
        createdBy: user.id,
        workflowId: workflow.id,
        color: '#0000ff',
        members: {
          create: {
            userId: user.id,
            role: Role.OWNER,
          },
        },
      },
    });
    projectId = project.id;

    // Create Workspace for other user
    const otherWorkspace = await prismaService.workspace.create({
      data: {
        name: `Other Workspace ${Date.now()}`,
        slug: `other-workspace-${Date.now()}`,
        organizationId: otherOrganization.id,
        members: {
          create: {
            userId: otherUser.id,
            role: Role.OWNER,
          },
        },
      },
    });

    // Create Project for other user
    const otherProject = await prismaService.project.create({
      data: {
        name: 'Other Project',
        slug: `other-project-${Date.now()}`,
        workspaceId: otherWorkspace.id,
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        visibility: ProjectVisibility.PRIVATE,
        createdBy: otherUser.id,
        workflowId: workflowId, // Re-use same workflow for simplicity
        color: '#ff0000',
        members: {
          create: {
            userId: otherUser.id,
            role: Role.OWNER,
          },
        },
      },
    });
    otherProjectId = otherProject.id;

    // Create Status
    const status = await prismaService.taskStatus.create({
      data: {
        name: 'In Progress',
        color: '#ff0000',
        position: 1,
        workflowId: workflow.id,
        category: 'IN_PROGRESS',
      },
    });
    statusId = status.id;

    // Create searchable tasks for primary user
    const task1 = await prismaService.task.create({
      data: {
        title: 'Authentication Bug Fix',
        description: 'Fix authentication issue in login module',
        projectId: project.id,
        statusId: status.id,
        createdBy: user.id,
        priority: TaskPriority.HIGH,
        type: TaskType.BUG,
        taskNumber: 1,
        slug: `auth-bug-fix-${Date.now()}`,
      },
    });
    taskId = task1.id;

    await prismaService.task.create({
      data: {
        title: 'User Profile Feature',
        description: 'Implement user profile page with avatar upload',
        projectId: project.id,
        statusId: status.id,
        createdBy: user.id,
        priority: TaskPriority.MEDIUM,
        type: TaskType.STORY,
        taskNumber: 2,
        slug: `user-profile-${Date.now()}`,
      },
    });

    // Create a task for the other user (should NOT be visible to primary user)
    const taskOther = await prismaService.task.create({
      data: {
        title: 'Other User Private Task',
        description: 'Secret information for other user only',
        projectId: otherProject.id,
        statusId: status.id,
        createdBy: otherUser.id,
        priority: TaskPriority.HIGHEST,
        type: TaskType.BUG,
        taskNumber: 1,
        slug: `other-task-${Date.now()}`,
      },
    });
    otherTaskId = taskOther.id;
  });

  afterAll(async () => {
    if (prismaService) {
      // Cleanup all test data
      await prismaService.task.deleteMany({ where: { id: { in: [taskId, otherTaskId] } } });
      await prismaService.task.deleteMany({ where: { projectId: { in: [projectId, otherProjectId] } } });
      await prismaService.projectMember.deleteMany({ where: { userId: { in: [user.id, otherUser.id, memberUser.id, viewerUser.id] } } });
      await prismaService.project.deleteMany({ where: { id: { in: [projectId, otherProjectId] } } });
      await prismaService.workspace.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } });
      await prismaService.taskStatus.delete({ where: { id: statusId } });
      await prismaService.workflow.delete({ where: { id: workflowId } });
      await prismaService.organizationMember.deleteMany({ where: { userId: { in: [user.id, otherUser.id, memberUser.id, viewerUser.id] } } });
      await prismaService.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
      await prismaService.user.deleteMany({ where: { id: { in: [user.id, otherUser.id, memberUser.id, viewerUser.id] } } });
    }
    await app.close();
  });

  describe('/search/global (POST)', () => {
    it('should perform global search within authorized scope', () => {
      const searchDto: GlobalSearchDto = {
        query: 'authentication',
        organizationId: organizationId,
      };

      return request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('results');
          expect(res.body.results.length).toBeGreaterThan(0);
          expect(res.body.results[0].title).toContain('Authentication');
        });
    });

    it('should NOT return results from another organization (cross-tenant check)', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'Private Task', // This query matches otherUser's task
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${accessToken}`) // Authenticated as primary user
        .send(searchDto)
        .expect(HttpStatus.OK);

      // Primary user should not see otherUser's task even without explicit scope
      const otherTaskFound = response.body.results.some((r: any) => r.id === otherTaskId);
      expect(otherTaskFound).toBe(false);
      expect(response.body.total).toBe(0);
    });

    it('should return no results when explicitly providing unauthorized organizationId', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'authentication',
        organizationId: otherOrganizationId, // Explicitly target other user's org
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      expect(response.body.results.length).toBe(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('/search/advanced (POST)', () => {
    it('should perform advanced search with filters', () => {
      const searchDto: AdvancedSearchDto = {
        query: 'bug',
        taskTypes: [TaskType.BUG],
        priorities: [TaskPriority.HIGH],
        organizationId: organizationId,
      };

      return request(app.getHttpServer())
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('results');
          expect(res.body.total).toBeGreaterThan(0);
        });
    });

    it('should NOT return tasks from other user in advanced search', async () => {
      const searchDto: AdvancedSearchDto = {
        query: 'Private Task',
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      expect(response.body.total).toBe(0);
    });
  });

  describe('/search/quick (GET)', () => {
    it('should perform quick search and respect user scope', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/search/quick')
        .query({ q: 'Private Task' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.total).toBe(0);
    });

    it('should return results for other user when they search for their task', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/search/quick')
        .query({ q: 'Private Task' })
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.results[0].id).toBe(otherTaskId);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/search/global')
        .send({ query: 'test' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('User Search - Role-Based Field Filtering', () => {
    it('should return email and role for admin users (OWNER role)', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'Member',
        organizationId: organizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      // Find the member user in results
      const memberResult = response.body.results.find(
        (r: any) => r.type === 'user' && r.metadata?.username?.startsWith('member_user_'),
      );

      // OWNER should see email and role
      expect(memberResult).toBeDefined();
      expect(memberResult.metadata).toHaveProperty('email');
      expect(memberResult.metadata).toHaveProperty('role');
      expect(memberResult.metadata.email).toContain('member-test-');
      expect(memberResult.metadata.role).toBe('MEMBER');
    });

    it('should return email and role for admin users (MANAGER role)', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'Viewer',
        organizationId: organizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      // Find the viewer user in results
      const viewerResult = response.body.results.find(
        (r: any) => r.type === 'user' && r.metadata?.username?.startsWith('viewer_user_'),
      );

      // OWNER (searching user) should see email and role
      expect(viewerResult).toBeDefined();
      expect(viewerResult.metadata).toHaveProperty('email');
      expect(viewerResult.metadata).toHaveProperty('role');
      expect(viewerResult.metadata.email).toContain('viewer-test-');
      expect(viewerResult.metadata.role).toBe('VIEWER');
    });

    it('should NOT return email and role for non-admin users (MEMBER role)', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'Viewer',
        organizationId: organizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      // Find the viewer user in results
      const viewerResult = response.body.results.find(
        (r: any) => r.type === 'user' && r.metadata?.username?.startsWith('viewer_user_'),
      );

      // MEMBER should NOT see email and role
      expect(viewerResult).toBeDefined();
      expect(viewerResult.metadata).not.toHaveProperty('email');
      expect(viewerResult.metadata).not.toHaveProperty('role');
      // But should still see public fields
      expect(viewerResult.metadata).toHaveProperty('username');
      expect(viewerResult.metadata).toHaveProperty('avatar');
    });

    it('should NOT return email and role for non-admin users (VIEWER role)', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'Member',
        organizationId: organizationId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${viewerAccessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      // Find the member user in results
      const memberResult = response.body.results.find(
        (r: any) => r.type === 'user' && r.metadata?.username?.startsWith('member_user_'),
      );

      // VIEWER should NOT see email and role
      expect(memberResult).toBeDefined();
      expect(memberResult.metadata).not.toHaveProperty('email');
      expect(memberResult.metadata).not.toHaveProperty('role');
      // But should still see public fields
      expect(memberResult.metadata).toHaveProperty('username');
      expect(memberResult.metadata).toHaveProperty('avatar');
    });

    it('should include email in description only for admin users', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'member-test',
        organizationId: organizationId,
      };

      // Admin user (OWNER) should see email in description if bio is empty
      const adminResponse = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      const adminMemberResult = adminResponse.body.results.find(
        (r: any) => r.type === 'user' && r.metadata?.username?.startsWith('member_user_'),
      );

      expect(adminMemberResult).toBeDefined();
      // Description should contain email for admin
      expect(adminMemberResult.description).toContain('member-test-');

      // Non-admin user (MEMBER) should NOT see email in description
      const memberResponse = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      const memberMemberResult = memberResponse.body.results.find(
        (r: any) => r.type === 'user' && r.metadata?.username?.startsWith('member_user_'),
      );

      expect(memberMemberResult).toBeDefined();
      // Description should NOT contain email for non-admin
      // (it might be undefined if user has no bio, or contain the bio text)
      if (memberMemberResult.description) {
        expect(memberMemberResult.description).not.toContain('member-test-');
      }
    });

    it('should still return public fields for all users', async () => {
      const searchDto: GlobalSearchDto = {
        query: 'Search',
        organizationId: organizationId,
      };

      // Test with VIEWER (lowest privilege)
      const response = await request(app.getHttpServer())
        .post('/api/search/global')
        .set('Authorization', `Bearer ${viewerAccessToken}`)
        .send(searchDto)
        .expect(HttpStatus.OK);

      const searchResult = response.body.results.find(
        (r: any) => r.type === 'user' && r.title === 'Search Tester',
      );

      expect(searchResult).toBeDefined();
      // Should always have these public fields
      expect(searchResult).toHaveProperty('id');
      expect(searchResult).toHaveProperty('type');
      expect(searchResult).toHaveProperty('title');
      expect(searchResult.metadata).toHaveProperty('username');
      expect(searchResult.metadata).toHaveProperty('avatar');
    });
  });
});
