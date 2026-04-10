import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { RegisterDto } from './../src/modules/auth/dto/register.dto';
import { LoginDto } from './../src/modules/auth/dto/login.dto';
import { Role } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testUser: RegisterDto = {
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'StrongPassword123!',
    firstName: 'E2E',
    lastName: 'Test',
    username: `e2e_user_${Date.now()}`,
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.user.deleteMany({
        where: {
          email: testUser.email,
        },
      });
    }
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });

    it('should fail to register with existing email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          accessToken = res.body.access_token;
          refreshToken = res.body.refresh_token;
        });
    });

    it('should fail with incorrect password', () => {
      const loginDto: LoginDto = {
        email: testUser.email,
        password: 'WrongPassword',
      };

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh access token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          // Refresh token might be rotated or same depending on implementation
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('OIDC SSO (/auth/oidc)', () => {
    it('should get OIDC config', () => {
      return request(app.getHttpServer())
        .get('/api/auth/oidc/config')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('enabled');
          expect(res.body).toHaveProperty('configured');
          expect(res.body).toHaveProperty('providerName');
        });
    });

    it('should fail to login if OIDC is not configured', () => {
      return request(app.getHttpServer())
        .get('/api/auth/oidc/login')
        .expect(HttpStatus.SERVICE_UNAVAILABLE)
        .expect((res) => {
          expect(res.body.message).toBe('SSO is not configured');
        });
    });

    it('should redirect to login with error on invalid callback state', () => {
      return request(app.getHttpServer())
        .get('/api/auth/oidc/callback?code=123&state=abc')
        .expect(HttpStatus.FOUND) // 302 Redirect
        .expect('Location', '/login?error=sso_invalid_state');
    });

    it('should reject oidc exchange without session cookie', () => {
      return request(app.getHttpServer())
        .post('/api/auth/oidc/exchange')
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toBe('No SSO session found');
        });
    });
  });
});
