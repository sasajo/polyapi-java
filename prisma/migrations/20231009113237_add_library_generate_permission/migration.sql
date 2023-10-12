UPDATE api_key SET permissions = REPLACE(permissions, '"use": true', '"use": true, "libraryGenerate": true');
UPDATE api_key SET permissions = REPLACE(permissions, '"use"', '"execute"');
UPDATE api_key SET permissions = REPLACE(permissions, '"teach": true', '"teach": true, "manageWebhooks": true');
UPDATE api_key SET permissions = REPLACE(permissions, '"teach"', '"manageApiFunctions"');
