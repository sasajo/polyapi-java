# Java Client Library (INTERNAL)

This is the README for developers of PolyAPI or contributors to this project.

## Testing SNAPSHOT versions

You can test the development releases of the Java Client by either:

A. pulling this repo and building/installing locally to get the version in your local maven repository

OR

B. you can update your testing project's pom.xml to allow you to install SNAPSHOT versions that have already been published to the Maven Central Repository.

### A. Using a local build

Once you've cloned the repository locally: run `mvn clean install` from the project directory to install all dependencies, build the project and put it into your local repository.

At this point you can use it within local projects in order to test it by setting the built version within the `<poly.version>` property in your `pom.xml`

### B. Using published SNAPSHOT versions

Within your local Java project where you want to use the PolyAPI java client: update your project's `pom.xml` to enable pulling a released SNAPSHOT version from the Maven Central Repository:
```xml
<repositories>
  <repository>
    <name>Central Portal Snapshots</name>
    <id>central-portal-snapshots</id>
    <url>https://central.sonatype.com/repository/maven-snapshots/</url>
    <releases>
      <enabled>false</enabled>
    </releases>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
```

You should now be able to use SNAPSHOT versions within the `<poly.version>` property in your `pom.xml`

## Versioning

Maven uses SNAPSHOT versions to indicate development versions. So a version like `0.13.5-SNAPSHOT` is considered a development version. SNAPSHOT versions can be modified and redeployed under the same version number multiple times in order to update it without needing to increment a version number.


## How to deploy development versions

We've setup a github workflow which should automatically publish the SNAPSHOT version of the client to the Maven Central Repository whenever code changes are pushed to the `develop` branch.

1. Branch off of `develop` and make your changes as normal. Test locally until you are satisfied with the changeset.

2. Make sure there's changelog entries for your snapshot version. Remember that as we develop we don't need to increment version numbers, so if there's already a changelong entry for the current snapshot version then modify it, else make a new entry.

3. Push your changes and open a PR against `develop`.

4. After approval of your changes: merge into `develop` to trigger the Release workflow in Github which should build and deploy the SNAPSHOT version release. Make sure it succeeds!


## How to release to production

1. Checkout `develop` and bump the minor version within the README.md:
   ```
   - * Latest released version 0.15.3
   - * Latest snapshot version 0.15.4-SNAPSHOT
   + * Latest released version 0.15.4
   + * Latest snapshot version 0.15.5-SNAPSHOT
   ````

2. Commit and push.

3. Open a Release PR from `develop` into `main`.

4. After approval of the release: merge into `main` to trigger the Release workflow in Github which should build and deploy the production version release. Make sure it succeeds! You should see two commits from the `[maven-release-plugin]`, the first which prepares the release by removing the "-SNAPSHOT" part of the client version and then releasing that version, and then the second which prepares the next "-SNAPSHOT" version and updates all the pom.xml files accordingly.

5. Merge `main` back into `develop`.