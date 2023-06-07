import { Test } from "@nestjs/testing";
import { SpecsService } from "./specs.service";
import { FunctionService } from "function/function.service";
import { TypedMock, getFnMock, mockedAuthData } from "./test-utils";
import { WebhookService } from "webhook/webhook.service";
import { AuthProviderService } from "auth-provider/auth-provider.service";
import { ApiFunction, AuthProvider, CustomFunction, WebhookHandle } from "@prisma/client";
import { createMock } from '@golevelup/ts-jest';
import { ApiFunctionSpecification, AuthFunctionSpecification, CustomFunctionSpecification, Specification, WebhookHandleSpecification } from "../../packages/common/src/specs";


describe('SpecsService', () => {
    let specsService: SpecsService;

    const getApiFunctions = getFnMock<FunctionService['getApiFunctions']>();
    const getCustomFunctions = getFnMock<FunctionService['getCustomFunctions']>();
    const getWebhookHandles = getFnMock<WebhookService['getWebhookHandles']>();
    const getAuthProviders = getFnMock<AuthProviderService['getAuthProviders']>();
    
    const toApiFunctionSpecification = getFnMock<FunctionService['toApiFunctionSpecification']>();
    const toCustomFunctionSpecification = getFnMock<FunctionService['toCustomFunctionSpecification']>();
    const toWebhookHandleSpecification = getFnMock<WebhookService['toWebhookHandleSpecification']>();
    const toAuthFunctionSpecifications = getFnMock<AuthProviderService['toAuthFunctionSpecifications']>();


    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                SpecsService,
                {
                    provide: FunctionService,
                    useValue: {
                        getApiFunctions,
                        getCustomFunctions,
                        toApiFunctionSpecification,
                        toCustomFunctionSpecification
                    } as TypedMock<FunctionService>
                },
                {
                    provide: WebhookService,
                    useValue: {
                        getWebhookHandles,
                        toWebhookHandleSpecification
                    } as TypedMock<WebhookService>
                },
                {
                    provide: AuthProviderService,
                    useValue: {
                        getAuthProviders,
                        toAuthFunctionSpecifications
                    } as TypedMock<AuthProviderService>
                }
            ]
        }).compile();

        specsService = moduleRef.get(SpecsService);
    });


    describe('getSpecifications()', () => {
        it('Should fetch all functions, webhook handles and auth providers and return specifications from them.', async() => {
            // Setup

            const names = [];
            const contexts = [];
            const ids = [];


            const apiFunctions = createMock<ApiFunction[]>([{
                context: 'apiFunctions'
            }]);

            const customFunctions = createMock<CustomFunction[]>([{
                context: 'myCustomFunctions'
            }]);

            const webhookHandles = createMock<WebhookHandle[]>([{
                context: 'shopify.notifications'
            }]);

            const authProviders = createMock<AuthProvider[]>([{
                context: 'auth.login'
            }]);

            getApiFunctions.mockResolvedValue(apiFunctions);
            getCustomFunctions.mockResolvedValue(customFunctions);
            getWebhookHandles.mockResolvedValue(webhookHandles);
            getAuthProviders.mockResolvedValue(authProviders);

            
            const apiFunctionSpecification = createMock<ApiFunctionSpecification>({
                context: apiFunctions[0].context
            });

            const customFunctionSpecification = createMock<CustomFunctionSpecification>({
                context: customFunctions[0].context
            });

            const webhookHandleSpecification = createMock<WebhookHandleSpecification>({
                context: webhookHandles[0].context
            });

            const authFunctionSpecifications = createMock<AuthFunctionSpecification[]>([{
                context: authProviders[0].context
            }]);


            toApiFunctionSpecification.mockResolvedValue(apiFunctionSpecification);

            toCustomFunctionSpecification.mockResolvedValue(customFunctionSpecification);

            toWebhookHandleSpecification.mockResolvedValue(webhookHandleSpecification);

            toAuthFunctionSpecifications.mockResolvedValue(authFunctionSpecifications);

            // Action
            const result = await specsService.getSpecifications(mockedAuthData.environment.id, contexts, names, ids);
            
            // Expect
            expect(result).toStrictEqual([
                apiFunctionSpecification,
                customFunctionSpecification,
                webhookHandleSpecification,
                authFunctionSpecifications
            ]);
        });
    });


    describe('getSpecificationPaths()', () => {

        it('Should get specification paths.', async () => {
            // Setup
            const environmentId = 'foo';
            const firstId = 'b605ea4f-6e3a-4994-9307-25927024954a';
            const secondId = 'b605ea4f-6e3a-4994-9307-25927024954b';
            const getSpecificationsMock = jest.spyOn(specsService, 'getSpecifications');

            getSpecificationsMock.mockResolvedValue(createMock<Specification[]>([{
                name: 'foo.bar',
                id: firstId
            }, {
                name: 'foo.bar',
                context: 'store',
                id: secondId
            }]))
    
            // Action
            const result = await specsService.getSpecificationPaths(environmentId);
    
            // Expect
            expect(getSpecificationsMock).toHaveBeenCalledWith(environmentId);
            expect(result).toStrictEqual([
                {
                    id: firstId,
                    path: 'fooBar'
                }, {
                    id: secondId,
                    path: 'store.fooBar'
                }
            ]);

            // Restore
            getSpecificationsMock.mockRestore();

        });

    });
});