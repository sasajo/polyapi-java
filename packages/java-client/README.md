# Java Client Library (beta)
### v0.1.0

## Introduction
This is a Java client library for Poly API. It is generated from the [Poly specification](https://develop-k8s.polyapi.io/specs). It is based on its Typescript counterpart [polyapi](https://www.npmjs.com/package/polyapi)

## Requirements
- Java 17+
- Maven 3.6.3+ (or Gradle 7.2+) (optional)
- Poly API key

## Setting up project
1. Create a new Java Maven project
2. Download current library release from [here](https://develop-k8s.polyapi.io/java/poly-java-client-0.1.0.zip)
3. Unzip the downloaded file to `repo` directory in your project's root directory (where the `pom.xml` file is located)
4. Add the following to your project's `pom.xml` file to setup the local repository and add the dependency:
```xml
<repositories>
  <repository>
    <id>my-local-repo</id>
    <url>file://${project.basedir}/repo</url>
  </repository>
</repositories>
<pluginRepositories>
<pluginRepository>
  <id>my-local-repo</id>
  <url>file://${project.basedir}/repo</url>
</pluginRepository>
</pluginRepositories>
<dependencies>
  <dependency>
    <groupId>io.polyapi.client</groupId>
    <artifactId>library</artifactId>
    <version>0.1.0</version>
  </dependency>
</dependencies>
<build>
<plugins>
  <plugin>
    <groupId>io.polyapi.client</groupId>
    <artifactId>library</artifactId>
    <version>0.1.0</version>
    <executions>
      <execution>
        <phase>generate-sources</phase>
        <goals>
          <goal>generate-sources</goal>
        </goals>
        <configuration>
          <apiBaseUrl>https://develop-k8s.polyapi.io</apiBaseUrl>
          <apiKey>{API_KEY}</apiKey>
        </configuration>
      </execution>
    </executions>
  </plugin>
  <plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>build-helper-maven-plugin</artifactId>
    <version>3.2.0</version>
    <executions>
      <execution>
        <id>add-source</id>
        <phase>generate-sources</phase>
        <goals>
          <goal>add-source</goal>
        </goals>
        <configuration>
          <sources>
            <source>target/generated-sources</source>
          </sources>
        </configuration>
      </execution>
    </executions>
  </plugin>
</plugins>
</build>
```
Make sure you replace `{API_KEY}` with valid API key to access the Poly API.

5. Run `mvn clean compile` to generate the Poly functions and compile the project (this needs to be done everytime you update your Poly functions)

## Using the library
### Poly Functions
To use the Poly functions you can import `import io.polyapi.Poly;` and traverse through it to find the function you want to use. For example:
```java
var body = new Create$HotelDataBody();
var payload = new Create$Payload();
var result = Poly.hotelApi.hotelData.createRoomEntry("https://eofn4s3nvu8okku.m.pipedream.net", "meat", body, payload);
var data = result.getData();

System.out.println(data.getPrice());
``` 

### Webhook handlers
```java
Poly.events.itemPurchased((event, headers, params) -> {
  System.out.println(event.getPrice());
});
```

### Auth functions
```java
var clientId = "...";
var clientSecret = "...";
var scopes = new String[]{"offline_access"};

Poly.auth0.getToken(clientId, clientSecret, scopes, (token, url, error) -> {
    System.out.println(token);
    System.out.println(url);
    System.out.println(error);

    if (token != null) {
        ...
        // revoke token (optional, if you want to revoke the token after you are done with it)
        Poly.auth0.revokeToken(token);
    }
});
```

### Poly Variables
To use Poly variables you can import `import io.polyapi.Vari;` and traverse through it to find the variable you want to use. For example:
```java
var clientId = Vari.auth.clientId.get();
System.out.println(clientId);
```
You can update variable using the following code:
```java
Vari.auth.clientId.update("newClientId");
```
You can listen for update events:
```java
Vari.auth.clientId.onUpdate((event) -> {
  System.out.println("Previous value: " + event.getPreviousValue()+", currentValue: " + event.getCurrentValue());
});
```

## Limitations
Currently, the library needs to be used locally. We are working on publishing it to Maven Central.

Comparing to its Typescript counterpart, the Java library is still missing the following features:
- Error handlers
- Injecting Poly Variables to Poly Functions
- Fetching multiple Poly Variables from context
