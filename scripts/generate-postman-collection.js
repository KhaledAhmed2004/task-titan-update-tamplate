const fs = require('fs');
const path = require('path');

/**
 * Postman Collection Generator Script
 *
 * Usage: node scripts/generate-postman-collection.js <module-name>
 * Example: node scripts/generate-postman-collection.js auth
 *
 * This script automatically generates a Postman collection for a specific module
 * by analyzing the route files and detecting environment variables.
 */

class PostmanCollectionGenerator {
  constructor() {
    this.baseUrl = '{{BASE_URL}}';
    this.apiPrefix = '';
    this.envVariables = new Set();
    this.collection = {
      info: {
        name: '',
        description: 'Auto-generated Postman collection',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: [],
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{AUTH_TOKEN}}',
            type: 'string',
          },
        ],
      },
    };
  }

  /**
   * Main method to generate collection for a module
   */
  async generateCollection(moduleName) {
    try {
      console.log(`🚀 Generating Postman collection for module: ${moduleName}`);

      // Validate module exists
      const moduleExists = await this.validateModule(moduleName);
      if (!moduleExists) {
        console.error(`❌ Module '${moduleName}' not found!`);
        this.listAvailableModules();
        return;
      }

      // Set collection name
      this.collection.info.name = `${this.capitalizeFirst(
        moduleName
      )} API Collection`;
      this.collection.info.description = `Auto-generated Postman collection for ${moduleName} module`;

      // Parse routes
      const routes = await this.parseModuleRoutes(moduleName);

      // Generate requests
      this.generateRequests(routes, moduleName);

      // Add environment variables
      this.addEnvironmentVariables();

      // Save collection
      await this.saveCollection(moduleName);

      console.log(`✅ Collection generated successfully!`);
      console.log(
        `📁 File saved as: postman-collections/${moduleName}-collection.json`
      );
    } catch (error) {
      console.error('❌ Error generating collection:', error.message);
    }
  }

  /**
   * Validate if module exists
   */
  async validateModule(moduleName) {
    const modulePath = path.join(
      process.cwd(),
      'src',
      'app',
      'modules',
      moduleName
    );
    return fs.existsSync(modulePath);
  }

  /**
   * List available modules
   */
  listAvailableModules() {
    const modulesPath = path.join(process.cwd(), 'src', 'app', 'modules');
    if (fs.existsSync(modulesPath)) {
      const modules = fs
        .readdirSync(modulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      console.log('\n📋 Available modules:');
      modules.forEach(module => console.log(`  - ${module}`));
    }
  }

  /**
   * Parse module routes from route file
   */
  async parseModuleRoutes(moduleName) {
    const routeFilePath = path.join(
      process.cwd(),
      'src',
      'app',
      'modules',
      moduleName,
      `${moduleName}.route.ts`
    );

    if (!fs.existsSync(routeFilePath)) {
      // Try alternative naming patterns
      const alternativeFiles = [
        `${moduleName}.routes.ts`,
        `${moduleName}s.route.ts`,
        'routes.ts',
      ];

      let found = false;
      for (const altFile of alternativeFiles) {
        const altPath = path.join(
          process.cwd(),
          'src',
          'app',
          'modules',
          moduleName,
          altFile
        );
        if (fs.existsSync(altPath)) {
          return this.parseRouteFile(altPath, moduleName);
        }
      }

      throw new Error(`Route file not found for module: ${moduleName}`);
    }

    return this.parseRouteFile(routeFilePath, moduleName);
  }

  /**
   * Parse route file content
   */
  parseRouteFile(filePath, moduleName) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const routes = [];

    // Extract router method calls with their preceding comments
    const routeRegex =
      /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const [fullMatch, method, path] = match;

      // Find the line number of this match
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length - 1;

      // Look for comments in the preceding lines
      let customName = null;
      for (let i = lineNumber - 1; i >= 0; i--) {
        const line = lines[i].trim();

        // Stop if we hit another route or non-comment/empty line
        if (
          line.startsWith('router.') ||
          (line &&
            !line.startsWith('//') &&
            !line.startsWith('/*') &&
            !line.startsWith('*'))
        ) {
          break;
        }

        // Extract comment content
        if (line.startsWith('//')) {
          customName = line.replace('//', '').trim();
          break;
        } else if (line.startsWith('/*') || line.startsWith('*')) {
          customName = line.replace(/^\/\*|\*\/|\*/g, '').trim();
          if (customName) break;
        }
      }

      routes.push({
        method: method.toUpperCase(),
        path: path,
        customName: customName,
        originalLine: fullMatch,
      });
    }

    // Get base path from main routes
    const basePath = this.getModuleBasePath(moduleName);

    return routes.map(route => ({
      ...route,
      fullPath: `${this.apiPrefix}${basePath}${route.path}`,
    }));
  }

  /**
   * Get module base path from main routes file
   */
  getModuleBasePath(moduleName) {
    try {
      const mainRoutesPath = path.join(
        process.cwd(),
        'src',
        'routes',
        'index.ts'
      );
      const content = fs.readFileSync(mainRoutesPath, 'utf8');

      // Map module names to their paths
      const modulePathMap = {
        auth: '/auth',
        user: '/user',
        task: '/tasks',
        bid: '/',
        rating: '/ratings',
        report: '/reports',
        faq: '/faqs',
        chat: '/chats',
        message: '/messages',
        rule: '/rules',
        category: '/categories',
        payment: '/payments',
        bookmark: '/bookmarks',
        comments: '/comments',
        notification: '/notifications',
        banner: '/banners',
        admin: '/dashboard',
        homePageEdit: '/homepage-edit',
      };

      return modulePathMap[moduleName] || `/${moduleName}`;
    } catch (error) {
      return `/${moduleName}`;
    }
  }

  /**
   * Generate Postman requests from routes
   */
  generateRequests(routes, moduleName) {
    routes.forEach(route => {
      const request = this.createPostmanRequest(route, moduleName);
      this.collection.item.push(request);
    });
  }

  /**
   * Create individual Postman request
   */
  createPostmanRequest(route, moduleName) {
    const requestName = this.generateRequestName(route);
    const url = `${this.baseUrl}${route.fullPath}`;

    const request = {
      name: requestName,
      request: {
        method: route.method,
        header: this.getDefaultHeaders(route),
        url: {
          raw: url,
          host: ['{{BASE_URL}}'],
          path: route.fullPath.split('/').filter(p => p),
        },
      },
      response: [],
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      request.request.body = {
        mode: 'json',
        json: this.generateSampleBody(route, moduleName),
      };
    }

    // Add auth if needed
    if (this.requiresAuth(route)) {
      request.request.auth = {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{AUTH_TOKEN}}',
            type: 'string',
          },
        ],
      };
    }

    return request;
  }

  /**
   * Generate readable request name
   */
  generateRequestName(route) {
    // Use custom name from comment if available
    if (route.customName) {
      return route.customName;
    }

    // Fallback to original logic
    const method = route.method;
    let path = route.path;

    // Convert path to readable name
    if (path === '/') {
      return `${method} - Get All`;
    }

    // Handle parameter paths
    path = path.replace(/:\w+/g, match => {
      const param = match.substring(1);
      return `{${param}}`;
    });

    // Convert to title case
    const pathParts = path.split('/').filter(p => p);
    const readablePath = pathParts
      .map(part => {
        if (part.includes('{')) return part;
        return part
          .split('-')
          .map(word => this.capitalizeFirst(word))
          .join(' ');
      })
      .join(' - ');

    return `${method} - ${readablePath || 'Root'}`;
  }

  /**
   * Get default headers for request
   */
  getDefaultHeaders(route) {
    const headers = [
      {
        key: 'Content-Type',
        value: 'application/json',
        type: 'text',
      },
    ];

    return headers;
  }

  /**
   * Check if route requires authentication
   */
  requiresAuth(route) {
    // Most routes require auth except login, register, public endpoints
    const publicEndpoints = [
      '/login',
      '/register',
      '/google',
      '/google/callback',
    ];
    return !publicEndpoints.some(endpoint => route.path.includes(endpoint));
  }

  /**
   * Generate sample request body
   */
  generateSampleBody(route, moduleName) {
    // Basic sample bodies based on common patterns using variables
    const sampleBodies = {
      auth: {
        '/login': { email: '{{TEST_EMAIL}}', password: '{{TEST_PASSWORD}}' },
        '/register': {
          name: '{{TEST_NAME}}',
          email: '{{TEST_EMAIL}}',
          password: '{{TEST_PASSWORD}}',
        },
        '/forget-password': { email: '{{TEST_EMAIL}}' },
        '/reset-password': {
          token: '{{RESET_TOKEN}}',
          newPassword: '{{NEW_PASSWORD}}',
        },
        '/change-password': {
          oldPassword: '{{OLD_PASSWORD}}',
          newPassword: '{{NEW_PASSWORD}}',
        },
        '/verify-email': {
          token: '{{VERIFY_TOKEN}}',
          email: '{{TEST_EMAIL}}',
        },
        '/resend-verify-email': {
          email: '{{TEST_EMAIL}}',
        },
      },
      user: {
        '/': {
          name: '{{TEST_NAME}}',
          email: '{{TEST_EMAIL}}',
          role: '{{USER_ROLE}}',
        },
        '/profile': { name: '{{UPDATED_NAME}}', bio: '{{USER_BIO}}' },
      },
      task: {
        '/': {
          title: '{{TASK_TITLE}}',
          description: '{{TASK_DESCRIPTION}}',
          budget: '{{TASK_BUDGET}}',
          deadline: '{{TASK_DEADLINE}}',
        },
      },
    };

    if (sampleBodies[moduleName] && sampleBodies[moduleName][route.path]) {
      return sampleBodies[moduleName][route.path];
    }

    return {};
  }

  /**
   * Add environment variables to collection
   */
  addEnvironmentVariables() {
    const detectedVars = this.detectEnvironmentVariables();

    const defaultVars = [
      {
        key: 'BASE_URL',
        value: 'http://localhost:5000/api/v1',
        type: 'string',
      },
      { key: 'AUTH_TOKEN', value: '', type: 'string' },
      // Test data variables
      { key: 'TEST_EMAIL', value: 'test@example.com', type: 'string' },
      { key: 'TEST_PASSWORD', value: 'password123', type: 'string' },
      { key: 'TEST_NAME', value: 'John Doe', type: 'string' },
      { key: 'NEW_PASSWORD', value: 'newPassword123', type: 'string' },
      { key: 'OLD_PASSWORD', value: 'oldPassword123', type: 'string' },
      { key: 'RESET_TOKEN', value: 'sample_reset_token', type: 'string' },
      { key: 'VERIFY_TOKEN', value: 'sample_verify_token', type: 'string' },
      { key: 'USER_ROLE', value: 'POSTER', type: 'string' },
      { key: 'UPDATED_NAME', value: 'Updated Name', type: 'string' },
      { key: 'USER_BIO', value: 'This is my bio', type: 'string' },
      { key: 'TASK_TITLE', value: 'Sample Task Title', type: 'string' },
      {
        key: 'TASK_DESCRIPTION',
        value: 'Sample task description',
        type: 'string',
      },
      { key: 'TASK_BUDGET', value: '100', type: 'string' },
      { key: 'TASK_DEADLINE', value: '2024-12-31', type: 'string' },
    ];

    // Merge detected variables with defaults
    const allVars = [...defaultVars, ...detectedVars];
    this.collection.variable = allVars;
  }

  /**
   * Detect environment variables from config files
   */
  detectEnvironmentVariables() {
    const envVars = [];

    try {
      // Read config file
      const configPath = path.join(process.cwd(), 'src', 'config', 'index.ts');
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');

        // Extract environment variables
        const envRegex = /process\.env\.([A-Z_]+)/g;
        let match;
        const foundVars = new Set();

        while ((match = envRegex.exec(configContent)) !== null) {
          const varName = match[1];
          if (!foundVars.has(varName)) {
            foundVars.add(varName);

            // Add common environment variables that might be needed
            const commonVars = {
              PORT: '5000',
              NODE_ENV: 'development',
              DATABASE_URL: 'mongodb://localhost:27017/task_titans',
              JWT_SECRET: 'your-jwt-secret',
              JWT_EXPIRE_IN: '7d',
              EMAIL_FROM: 'noreply@tasktitans.com',
              EMAIL_USER: 'your-email@gmail.com',
              EMAIL_PASS: 'your-email-password',
              EMAIL_HOST: 'smtp.gmail.com',
              EMAIL_PORT: '587',
              SUPER_ADMIN_EMAIL: 'admin@tasktitans.com',
              SUPER_ADMIN_PASSWORD: 'admin123',
              GOOGLE_CLIENT_ID: 'your-google-client-id',
              GOOGLE_CLIENT_SECRET: 'your-google-client-secret',
              GOOGLE_REDIRECT_URI: '{{BASE_URL}}/auth/google/callback',
            };

            envVars.push({
              key: varName,
              value: commonVars[varName] || '',
              type: 'string',
            });
          }
        }
      }

      // Read .env file if exists
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'));

        envLines.forEach(line => {
          const [key, value] = line.split('=');
          if (key && !envVars.find(v => v.key === key.trim())) {
            envVars.push({
              key: key.trim(),
              value: value ? value.trim() : '',
              type: 'string',
            });
          }
        });
      }
    } catch (error) {
      console.warn(
        '⚠️  Could not detect environment variables:',
        error.message
      );
    }

    return envVars;
  }

  /**
   * Save collection to file
   */
  async saveCollection(moduleName) {
    const outputDir = path.join(process.cwd(), 'postman-collections');

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${moduleName}-collection.json`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(this.collection, null, 2));
  }

  /**
   * Utility: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Please provide a module name');
    console.log(
      'Usage: node scripts/generate-postman-collection.js <module-name>'
    );
    console.log('Example: node scripts/generate-postman-collection.js auth');
    process.exit(1);
  }

  const moduleName = args[0].toLowerCase();
  const generator = new PostmanCollectionGenerator();
  await generator.generateCollection(moduleName);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PostmanCollectionGenerator;
