import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { PolyKeyGuard } from 'auth/poly-key-auth-guard.service';
import { TenantService } from 'tenant/tenant.service';
import {
  ApiKeyDto,
  ApplicationDto,
  CreateApiKeyDto,
  CreateApplicationDto,
  CreateEnvironmentDto,
  CreateTeamDto,
  CreateTenantDto,
  CreateUserDto,
  EnvironmentDto,
  GetTenantQuery,
  Role,
  TeamDto,
  TenantDto,
  UpdateApiKeyDto,
  UpdateApplicationDto,
  UpdateEnvironmentDto,
  UpdateTeamDto,
  UpdateTenantDto,
  UpdateUserDto,
  UserDto,
} from '@poly/common';
import { EnvironmentService } from 'environment/environment.service';
import { TeamService } from 'team/team.service';
import { AuthService } from 'auth/auth.service';
import { AuthRequest } from 'common/types';
import { UserService } from 'user/user.service';
import { ApplicationService } from 'application/application.service';

@ApiSecurity('X-PolyApiKey')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
    private readonly environmentService: EnvironmentService,
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly applicationService: ApplicationService,
  ) {
  }

  @UseGuards(new PolyKeyGuard([Role.SuperAdmin]))
  @Get()
  async getTenants(): Promise<TenantDto[]> {
    return (await this.tenantService.getAll())
      .map(tenant => this.tenantService.toDto(tenant));
  }

  @UseGuards(new PolyKeyGuard([Role.SuperAdmin]))
  @Post()
  async createTenant(@Body() data: CreateTenantDto): Promise<TenantDto> {
    const { name } = data;
    return this.tenantService.toDto(await this.tenantService.create(name));
  }

  @UseGuards(PolyKeyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  async getTenant(@Req() req: AuthRequest, @Param('id') id: string, @Query() { full = false }: GetTenantQuery): Promise<TenantDto> {
    const tenant = await this.findTenant(id);

    await this.authService.checkTenantAccess(tenant.id, req.user, [Role.Admin]);

    return full
      ? this.tenantService.toFullDto(tenant)
      : this.tenantService.toDto(tenant);
  }

  @UseGuards(new PolyKeyGuard([Role.SuperAdmin]))
  @Post(':id')
  async updateTenant(@Param('id') id: string, @Body() data: UpdateTenantDto): Promise<TenantDto> {
    const { name } = data;
    return this.tenantService.toDto(
      await this.tenantService.update(await this.findTenant(id), name),
    );
  }

  @UseGuards(new PolyKeyGuard([Role.SuperAdmin]))
  @Delete(':id')
  async deleteTenant(@Param('id') id: string) {
    await this.tenantService.delete(await this.findTenant(id));
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/teams')
  async getTeams(@Req() req: AuthRequest, @Param('id') tenantId: string): Promise<TeamDto[]> {
    const tenant = await this.findTenant(tenantId);
    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);
    return (await this.teamService.getAllByTenant(tenant.id))
      .map(team => this.teamService.toDto(team));
  }

  @UseGuards(PolyKeyGuard)
  @Post(':id/teams')
  async createTeam(@Req() req: AuthRequest, @Param('id') tenantId: string, @Body() data: CreateTeamDto): Promise<TeamDto> {
    const tenant = await this.findTenant(tenantId);
    const { name } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.teamService.toDto(
      await this.teamService.create(tenant.id, name),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/teams/:teamId')
  async getTeam(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('teamId') teamId: string): Promise<TeamDto> {
    const team = await this.findTeam(tenantId, teamId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.teamService.toDto(team);
  }

  @UseGuards(PolyKeyGuard)
  @Patch(':id/teams/:teamId')
  async updateTeam(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('teamId') teamId: string, @Body() data: UpdateTeamDto): Promise<TeamDto> {
    const team = await this.findTeam(tenantId, teamId);
    const { name } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.teamService.toDto(
      await this.teamService.update(team, name),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Delete(':id/teams/:teamId')
  async deleteTeam(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('teamId') teamId: string) {
    const team = await this.findTeam(tenantId, teamId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    await this.teamService.delete(team.id);
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/teams/:teamId/users')
  async getUsers(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('teamId') teamId: string): Promise<UserDto[]> {
    const team = await this.findTeam(tenantId, teamId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return (await this.userService.getAllUsersByTeam(team.id))
      .map(user => this.userService.toUserDto(user));
  }

  @UseGuards(PolyKeyGuard)
  @Post(':id/teams/:teamId/users')
  async createUser(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('teamId') teamId: string, @Body() data: CreateUserDto): Promise<UserDto> {
    const team = await this.findTeam(tenantId, teamId);
    const { name, role = Role.User } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.userService.toUserDto(
      await this.userService.createUser(team.id, name, role as Role),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/teams/:teamId/users/:userId')
  async getUser(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    const user = await this.findUser(tenantId, teamId, userId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.userService.toUserDto(user);
  }

  @UseGuards(PolyKeyGuard)
  @Patch(':id/teams/:teamId/users/:userId')
  async updateUser(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Body() data: UpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.findUser(tenantId, teamId, userId);
    const { name, role } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.userService.toUserDto(
      await this.userService.updateUser(user, name, role as Role),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Delete(':id/teams/:teamId/users/:userId')
  async deleteUser(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('teamId') teamId: string, @Param('userId') userId: string) {
    const user = await this.findUser(tenantId, teamId, userId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    await this.userService.deleteUser(user.id);
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/environments')
  async getEnvironments(@Req() req: AuthRequest, @Param('id') tenantId: string): Promise<EnvironmentDto[]> {
    const tenant = await this.findTenant(tenantId);
    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);
    return (await this.environmentService.getAllByTenant(tenant.id))
      .map(environment => this.environmentService.toDto(environment));
  }

  @UseGuards(PolyKeyGuard)
  @Post(':id/environments')
  async createEnvironment(@Req() req: AuthRequest, @Param('id') tenantId: string, @Body() data: CreateEnvironmentDto): Promise<EnvironmentDto> {
    const tenant = await this.findTenant(tenantId);
    const { name } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.environmentService.toDto(
      await this.environmentService.create(tenant.id, name),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/environments/:environmentId')
  async getEnvironment(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
  ): Promise<EnvironmentDto> {
    const environment = await this.findEnvironment(tenantId, environmentId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.environmentService.toDto(environment);
  }

  @UseGuards(PolyKeyGuard)
  @Patch(':id/environments/:environmentId')
  async updateEnvironment(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Body() data: UpdateEnvironmentDto,
  ): Promise<EnvironmentDto> {
    const environment = await this.findEnvironment(tenantId, environmentId);
    const { name } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.environmentService.toDto(
      await this.environmentService.update(environment, name),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Delete(':id/environments/:environmentId')
  async deleteEnvironment(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('environmentId') environmentId: string) {
    const environment = await this.findEnvironment(tenantId, environmentId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    await this.environmentService.delete(environment.id);
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/environments/:environmentId/api-keys')
  async getApiKeys(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('environmentId') environmentId: string): Promise<ApiKeyDto[]> {
    await this.findEnvironment(tenantId, environmentId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return (await this.authService.getAllApiKeys(environmentId))
      .map(apiKey => this.authService.toApiKeyDto(apiKey));
  }

  @UseGuards(PolyKeyGuard)
  @Post(':id/environments/:environmentId/api-keys')
  async createApiKey(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Body() data: CreateApiKeyDto,
  ): Promise<ApiKeyDto> {
    const { name, key, applicationId = null, userId = null, permissions } = data;
    await this.findEnvironment(tenantId, environmentId);

    if (!userId && !applicationId) {
      throw new BadRequestException('Either userId or applicationId must be provided');
    }
    const application = applicationId ? await this.findApplication(tenantId, environmentId, applicationId) : null;
    const user = userId ? await this.findUser(tenantId, null, userId) : null;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.authService.toApiKeyDto(
      await this.authService.createApiKey(environmentId, name, application, user, permissions, key),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/environments/:environmentId/api-keys/:apiKeyId')
  async getApiKey(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Param('apiKeyId') apiKeyId: string,
  ): Promise<ApiKeyDto> {
    const apiKey = await this.findApiKey(tenantId, environmentId, apiKeyId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.authService.toApiKeyDto(apiKey);
  }

  @UseGuards(PolyKeyGuard)
  @Patch(':id/environments/:environmentId/api-keys/:apiKeyId')
  async updateApiKey(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Param('apiKeyId') apiKeyId: string,
    @Body() data: UpdateApiKeyDto,
  ): Promise<ApiKeyDto> {
    const apiKey = await this.findApiKey(tenantId, environmentId, apiKeyId);
    const { name, permissions } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.authService.toApiKeyDto(
      await this.authService.updateApiKey(apiKey, name, permissions),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Delete(':id/environments/:environmentId/api-keys/:apiKeyId')
  async deleteApiKey(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Param('apiKeyId') apiKeyId: string,
  ) {
    const apiKey = await this.findApiKey(tenantId, environmentId, apiKeyId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    await this.authService.deleteApiKey(apiKey.id);
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/environments/:environmentId/applications')
  async getApplications(@Req() req: AuthRequest, @Param('id') tenantId: string, @Param('environmentId') environmentId: string): Promise<ApplicationDto[]> {
    await this.findEnvironment(tenantId, environmentId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return (await this.applicationService.getAll(environmentId))
      .map(application => this.applicationService.toApplicationDto(application));
  }

  @UseGuards(PolyKeyGuard)
  @Post(':id/environments/:environmentId/applications')
  async createApplication(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Body() data: CreateApplicationDto,
  ): Promise<ApplicationDto> {
    const { name, description } = data;
    await this.findEnvironment(tenantId, environmentId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.applicationService.toApplicationDto(
      await this.applicationService.create(environmentId, name, description),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Get(':id/environments/:environmentId/applications/:applicationId')
  async getApplication(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationDto> {
    const application = await this.findApplication(tenantId, environmentId, applicationId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.applicationService.toApplicationDto(application);
  }

  @UseGuards(PolyKeyGuard)
  @Patch(':id/environments/:environmentId/applications/:applicationId')
  async updateApplication(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Param('applicationId') applicationId: string,
    @Body() data: UpdateApplicationDto,
  ): Promise<ApplicationDto> {
    const application = await this.findApplication(tenantId, environmentId, applicationId);
    const { name, description } = data;

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    return this.applicationService.toApplicationDto(
      await this.applicationService.update(application, name, description),
    );
  }

  @UseGuards(PolyKeyGuard)
  @Delete(':id/environments/:environmentId/applications/:applicationId')
  async deleteApplication(
    @Req() req: AuthRequest,
    @Param('id') tenantId: string,
    @Param('environmentId') environmentId: string,
    @Param('applicationId') applicationId: string,
  ) {
    const application = await this.findApplication(tenantId, environmentId, applicationId);

    await this.authService.checkTenantAccess(tenantId, req.user, [Role.Admin]);

    await this.applicationService.delete(application.id);
  }

  private async findTenant(id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  private async findTeam(tenantId: string, id: string) {
    const tenant = await this.findTenant(tenantId);
    const team = await this.teamService.findById(id);
    if (!team || team.tenantId !== tenant.id) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return team;
  }

  private async findUser(tenantId: string, teamId: string | null, userId: string) {
    const team = teamId ? await this.findTeam(tenantId, teamId) : null;
    const user = await this.userService.findUserById(userId);

    if (!user || (team && user.teamId !== team.id)) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  private async findEnvironment(tenantId: string, environmentId: string) {
    const tenant = await this.findTenant(tenantId);
    const environment = await this.environmentService.findById(environmentId);

    if (!environment || environment.tenantId !== tenant.id) {
      throw new NotFoundException(`Environment with id ${environmentId} not found`);
    }

    return environment;
  }

  private async findApiKey(tenantId: string, environmentId: string, apiKeyId: string) {
    await this.findEnvironment(tenantId, environmentId);
    const apiKey = await this.authService.findApiKeyById(apiKeyId, true);

    if (!apiKey || apiKey.environmentId !== environmentId) {
      throw new NotFoundException(`ApiKey with id ${apiKeyId} not found`);
    }
    return apiKey;
  }

  private async findApplication(tenantId: string, environmentId: string, applicationId: string) {
    await this.findEnvironment(tenantId, environmentId);
    const application = await this.applicationService.findById(applicationId);

    if (!application || application.environmentId !== environmentId) {
      throw new NotFoundException(`Application with id ${applicationId} not found`);
    }
    return application;
  }
}
