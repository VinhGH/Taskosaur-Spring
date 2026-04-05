import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { UserSource, UserStatus } from '@prisma/client';
import { JwtPayload } from '../strategies/jwt.strategy';

// openid-client v5 is ESM-only — must use dynamic import in CommonJS
let _oidcModule: typeof import('openid-client') | null = null;
async function getOidcModule() {
  if (!_oidcModule) {
    _oidcModule = await import('openid-client');
  }
  return _oidcModule;
}

interface OidcConfig {
  enabled: boolean;
  providerName: string;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private client: any = null;
  private lastConfigHash: string = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getOidcConfig(): Promise<OidcConfig> {
    const [enabled, providerName, issuerUrl, clientId, clientSecret, redirectUri] =
      await Promise.all([
        this.settingsService.get('sso_enabled'),
        this.settingsService.get('sso_provider_name'),
        this.settingsService.get('sso_issuer_url'),
        this.settingsService.get('sso_client_id'),
        this.settingsService.get('sso_client_secret'),
        this.settingsService.get('sso_redirect_uri'),
      ]);

    return {
      enabled: enabled === 'true',
      providerName: providerName || 'SSO Provider',
      issuerUrl: issuerUrl || '',
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      redirectUri: redirectUri || '',
    };
  }

  async isConfigured(): Promise<{ enabled: boolean; configured: boolean; providerName: string }> {
    const config = await this.getOidcConfig();
    const fullyConfigured = !!config.issuerUrl && !!config.clientId && !!config.clientSecret;
    return {
      enabled: config.enabled,
      configured: fullyConfigured,
      providerName: config.providerName,
    };
  }

  private async getClient(): Promise<any> {
    const config = await this.getOidcConfig();

    if (!config.enabled || !config.issuerUrl || !config.clientId || !config.clientSecret) {
      throw new ServiceUnavailableException('SSO is not configured');
    }

    // Cache client, reinitialize if config changed
    const configHash = `${config.issuerUrl}:${config.clientId}:${config.redirectUri}`;
    if (this.client && this.lastConfigHash === configHash) {
      return this.client;
    }

    try {
      const { Issuer } = await getOidcModule();
      const issuer = await Issuer.discover(config.issuerUrl);
      this.client = new issuer.Client({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
      });
      this.lastConfigHash = configHash;
      this.logger.log(`OIDC client initialized for issuer: ${config.issuerUrl}`);
      return this.client;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to discover OIDC issuer: ${msg}`);
      throw new ServiceUnavailableException('Failed to connect to SSO provider');
    }
  }

  async getAuthorizationUrl(): Promise<{ url: string; state: string; nonce: string }> {
    const oidcClient = await this.getClient();
    const { generators } = await getOidcModule();
    const state = generators.state();
    const nonce = generators.nonce();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const url: string = oidcClient.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
    });

    return { url, state, nonce };
  }

  async handleCallback(code: string, state: string, storedState: string, storedNonce: string) {
    if (state !== storedState) {
      throw new BadRequestException('Invalid SSO state parameter');
    }

    const oidcClient = await this.getClient();
    const config = await this.getOidcConfig();

    let tokenSet: { claims: () => Record<string, unknown> };
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      tokenSet = await oidcClient.callback(
        config.redirectUri,
        { code, state },
        { state: storedState, nonce: storedNonce },
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OIDC callback error: ${msg}`);
      throw new BadRequestException('SSO authentication failed');
    }

    const claims = tokenSet.claims();
    if (!claims.email) {
      throw new BadRequestException('SSO provider did not return an email address');
    }

    const email = typeof claims.email === 'string' ? claims.email : '';
    const firstName =
      (typeof claims.given_name === 'string' ? claims.given_name : '') ||
      (typeof claims.name === 'string' ? claims.name.split(' ')[0] : '') ||
      'User';
    const lastName =
      (typeof claims.family_name === 'string' ? claims.family_name : '') ||
      (typeof claims.name === 'string' ? claims.name.split(' ').slice(1).join(' ') : '') ||
      '';
    const externalId = claims.sub;
    const emailVerified = claims.email_verified === true;

    if (!externalId || typeof externalId !== 'string') {
      throw new BadRequestException('SSO provider did not return a valid user identifier');
    }

    // Find or create user
    const user = await this.findOrCreateSsoUser(
      email,
      firstName,
      lastName,
      externalId,
      config.providerName,
      emailVerified,
    );

    // Generate JWT tokens (same pattern as auth.service login)
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    // Store refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        username: user.username || undefined,
        avatar: user.avatar || undefined,
      },
    };
  }

  private async findOrCreateSsoUser(
    email: string,
    firstName: string,
    lastName: string,
    externalId: string,
    provider: string,
    emailVerified: boolean = false,
  ) {
    // Try finding by externalId first (most reliable)
    let user = await this.prisma.user.findUnique({
      where: { externalId },
    });

    if (user) {
      // Update last login
      if (user.status !== 'ACTIVE') {
        throw new BadRequestException('Your account is inactive. Contact your administrator.');
      }
      return user;
    }

    // Try finding by email (link existing account)
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.status !== 'ACTIVE') {
        throw new BadRequestException('Your account is inactive. Contact your administrator.');
      }
      // Link existing account with SSO
      return this.prisma.user.update({
        where: { id: user.id },
        data: { externalId, externalProvider: provider, source: UserSource.SSO },
      });
    }

    // Create new SSO user
    const baseUsername = email.split('@')[0].toLowerCase();
    let finalUsername = baseUsername;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { username: finalUsername } })) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    return this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        username: finalUsername,
        emailVerified,
        status: UserStatus.ACTIVE,
        source: UserSource.SSO,
        externalId,
        externalProvider: provider,
      },
    });
  }
}
