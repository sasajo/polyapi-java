import semver from 'semver';

export const librariesToCheck = ['ts-node', 'typescript'];

export const libraryMinVersionMap = {
  'ts-node': '5.0.0',
  typescript: '4.0.0',
};
const MIN_NODE_VERSION = '14.0.0';

const DEFAULT_TS_CONFIG = {
  compilerOptions: {
    esModuleInterop: true,
  },
};

export const MESSAGES = {
  TS_CONFIG_DO_NOT_EXIST: 'tsconfig.json does not exist in this project. Do you want to create it?',
  TS_CONFIG_UPDATE: 'tsconfig.json does not have esModuleInterop set to true. Do you want to update it?',
};

type TsConfigSetupSteps = {
    getCurrentConfig(): Promise<string | undefined>;
    requestUserPermissionToCreateTsConfig(): Promise<boolean>;
    requestUserPermissionToUpdateTsConfig(): Promise<boolean>;
    saveTsConfig(tsConfig: string): Promise<void>;
}

type CheckLibraryVersionSteps = {
    requestUserPermissionToUpdateLib(library: string, version: string, minVersion: string): Promise<boolean>;
    createOrUpdateLib(library: string, create: boolean): Promise<void>;
}

type CheckNodeVersionOpts = {
  onOldVersion(message: string): any;
  onSuccess?(): void;
}

export const getUpdateLibraryVersionMessage = (version: string, minVersion: string, library: string) => {
  return version
    ? `${library} version is lower than ${minVersion} in this project. Do you want to update it to the latest version?`
    : `${library} is not installed in this project. Do you want to install it?`;
};

export const checkTsConfig = async (steps: TsConfigSetupSteps) => {
  const currentConfig = await steps.getCurrentConfig();

  if (typeof currentConfig === 'undefined') {
    const createTsConfig = await steps.requestUserPermissionToCreateTsConfig();

    if (createTsConfig) {
      steps.saveTsConfig(JSON.stringify(DEFAULT_TS_CONFIG, null, 2));
    }
  } else {
    const tsConfig = JSON.parse(currentConfig);
    if (!tsConfig.compilerOptions?.esModuleInterop) {
      const updateTsConfig = await steps.requestUserPermissionToUpdateTsConfig();
      if (!updateTsConfig) {
        return;
      }

      tsConfig.compilerOptions = {
        ...tsConfig.compilerOptions,
        esModuleInterop: true,
      };
      await steps.saveTsConfig(JSON.stringify(tsConfig, null, 2));
    }
  }
};

const checkLibraryVersion = async (packageJson: Record<string, any>, library: string, minVersion: string, steps: CheckLibraryVersionSteps) => {
  const version = packageJson.devDependencies?.[library] || packageJson.dependencies?.[library];

  if (!version || semver.lt(version.replace(/[^0-9.]/g, ''), minVersion)) {
    const updateVersion = await steps.requestUserPermissionToUpdateLib(library, version, minVersion);

    if (updateVersion) {
      await steps.createOrUpdateLib(library, !version);
    }
  }
};

export const checkLibraryVersions = async (packageJson: Record<string, any>, steps: CheckLibraryVersionSteps) => {
  for (const library of librariesToCheck) {
    await checkLibraryVersion(packageJson, library, libraryMinVersionMap[library], steps);
  }
};

export const checkNodeVersion = (opts: CheckNodeVersionOpts) => {
  if (semver.lt(process.version, MIN_NODE_VERSION)) {
    opts.onOldVersion(`Node.js version is too old. The minimum required version is ${MIN_NODE_VERSION}. Please update Node.js to a newer version.`);
  } else {
    opts.onSuccess?.();
  }
};
