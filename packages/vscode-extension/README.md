**Poly Extension Overview**

Welcome to PolyAPI, a platform for seamless API and Event Stream integration. Poly empowers enterprises to innovate faster, streamline development, enhance security, and leverage AI for enhanced productivity.

**Key Use Cases**

- Simplified API and Event discovery and consumption for building new applications.
- Develop, run and manage integrations. 
- Create new AI agents powered by OpenAI Plugin Model which can be embedded within your applications. 

**Poly's strengths lie in its:**

- Kubernetes-native architecture.
- Support for common programming languages: Typescript and soon Python/Java
- Integration with popular developer tools like Postman, VS Code, OpenAI, KNative
- AI-powered assistance for efficient coding.
- Multilingual support for world wide developers.
- API powered learning from observation of API traffic, not theoretically correct documents/specs to populate a central catalog of APIs.
- Client library generation scoped to your project needs.
- Custom functions for versatile transformation, orchestration, aggregation, routing, and SOOO much more.
- Ability to pass credentials by reference from Hashicorp Vault without your clients ever having possession of secrets. 
- Server-side variables for runtime flexibility.

**For more info watch PolyAPI demo videos here: https://vimeo.com/polyapi**

**Getting Started: Creating a New Poly Account with Dependency Installation**

**Step 1: Install the Poly CLI and Dependencies**

1. Begin by installing the Poly CLI. Open your terminal in a project and run the following command: npm install polyapi
2. After a successful installation of the Poly CLI, you will be prompted with the following message:

> Poly CLI has been installed successfully. Would you like to install Node.js and TypeScript dependencies required for the CLI? (Y/N)

3. To proceed, type 'Y' and hit Enter. This confirms your consent to install the necessary Node.js and TypeScript dependencies.

The CLI will then automatically handle the installation of these dependencies, ensuring a smooth setup process.

**Step 2: Create a New Tenant**
If you are the first use setting up Poly for your company, please follow these steps. If your admin has already provided you an API key, feel free to skip these steps. 

1. To create a new tenant, use the following command in your terminal: 'npx poly tenant create'
2. You will be prompted to provide the email address associated with the new tenant. Enter your email address and press Enter.
3. An email containing a verification code will be sent to the provided email address. This verification code consists of 6 characters, including alphanumeric characters with capital letters.
4. Check your email for the verification code and enter it when prompted by the CLI.
5. If necessary, you can request to "resend" the verification code if you haven't received it.
6. Once you successfully enter the verification code, the CLI will proceed with creating your new tenant.

**Step 3: Generate the Poly Library**
1. To generate the library, run the following command 'npx poly generate'
2. You can pass in additional 'contexts=foo,bar' params to scope the library down to function contexts relevant to your project

Congratulations! You have now created a new Poly account with the required dependencies installed. You are ready to explore the capabilities of Poly and leverage its features for your development needs. If you have any questions or need further assistance, please refer to our AI Assistant, Poly. Happy coding with Poly!

**Poly AI Assistant Conversation Special Commands** 

You can use the following commands to generate responses for help /h in the AI Assistant. 

- /functions or /f or no slash command: search functions and variables and use them to answer the question 
- /help or /h: list out the available commands
- /poly or /p or /docs or /d: searches poly documentation 
- /general or /g: ask general questions to ChatGPT 
