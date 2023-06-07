import { ExecutionContext } from "@nestjs/common";
import { PolyKeyGuard } from 'auth/poly-key-auth-guard.service';

import { Role } from "../../packages/common/src/user";
import { AuthData } from "common/types";

const currentDate = new Date();

/**
 * remap methods from a type in a new one.
 */
export type ExtractMethods<Type> = {
    [Key in keyof Type as (Type[Key] extends (...args: any[]) => any ? Key : never)]: Type[Key];
}

/**
 * Utility type for using among with `useValue` when mock a provider to get full instellisense about provider methods.
 */
export type TypedMock<T> = Partial<ExtractMethods<T>>;

/**
 * Default mocked data used by `getMockedPolyKeyGuard`.
 */
export const mockedAuthData: AuthData = {
    user: {
        id: '3ba47ec4-8871-4fea-a221-c2e322acc3a6',
        name: 'foo',
        role: Role.Admin,
        vip: false,
        teamId: '2a918df0-dffd-4773-b2b4-2b5cd3182c5f',
        createdAt: currentDate
    },
    environment: {
        appKey: '',
        createdAt: currentDate,
        id: '',
        name: '',
        subdomain: '',
        tenantId: ''
    },
    tenant: {
        createdAt: currentDate,
        id: '',
        name: ''
    }
}

/**
 * Get mocked `PolyApiKeyGuard`.
 */
export function getMockedPolyKeyGuard(user: AuthData = mockedAuthData): TypedMock<PolyKeyGuard>{

    return {
        async canActivate(context: ExecutionContext): Promise<any> {
            context.switchToHttp().getRequest().user = user;
            return true;
        }
    }
}

/**
 * Get typed mock using `jest.fn`.
 */
export function getFnMock<T extends (...args: any) => any>() {
    return jest.fn<ReturnType<T>, Parameters<T>>();
}
