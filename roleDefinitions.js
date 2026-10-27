export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  ACCOUNTANT: 'accountant',
};

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    'business:read', 'business:update', 'business:delete',
    'billing:read', 'billing:update',
    'team:read', 'team:invite', 'team:update', 'team:remove',
    'customers:read', 'customers:create', 'customers:update', 'customers:delete',
    'leads:read', 'leads:create', 'leads:update', 'leads:delete', 'leads:convert',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'finance:read', 'finance:create', 'finance:update', 'finance:delete', 'finance:export',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:issue', 'invoices:pay', 'invoices:delete',
    'inventory:read', 'inventory:move', 'inventory:update',
    'marketing:read', 'marketing:create', 'marketing:update', 'marketing:delete',
    'reports:read', 'reports:export',
    'notifications:read', 'notifications:update',
    'audit:read'
  ],
  [ROLES.ADMIN]: [
    'business:read', 'business:update',
    'team:read', 'team:invite', 'team:update',
    'customers:read', 'customers:create', 'customers:update', 'customers:delete',
    'leads:read', 'leads:create', 'leads:update', 'leads:delete', 'leads:convert',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'finance:read', 'finance:create', 'finance:update',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:issue', 'invoices:pay',
    'inventory:read', 'inventory:move', 'inventory:update',
    'marketing:read', 'marketing:create', 'marketing:update', 'marketing:delete',
    'reports:read', 'reports:export',
    'notifications:read', 'notifications:update'
  ],
  [ROLES.MANAGER]: [
    'business:read',
    'team:read',
    'customers:read', 'customers:create', 'customers:update',
    'leads:read', 'leads:create', 'leads:update', 'leads:convert',
    'products:read',
    'projects:read', 'projects:create', 'projects:update',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'finance:read',
    'invoices:read',
    'inventory:read', 'inventory:move',
    'marketing:read',
    'reports:read',
    'notifications:read', 'notifications:update'
  ],
  [ROLES.EMPLOYEE]: [
    'business:read',
    'team:read',
    'customers:read',
    'leads:read',
    'products:read',
    'projects:read',
    'tasks:read', 'tasks:update',
    'notifications:read', 'notifications:update'
  ],
  [ROLES.ACCOUNTANT]: [
    'business:read',
    'customers:read',
    'products:read',
    'projects:read',
    'finance:read', 'finance:create', 'finance:update', 'finance:delete', 'finance:export',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:issue', 'invoices:pay',
    'inventory:read',
    'reports:read', 'reports:export',
    'notifications:read', 'notifications:update'
  ]
};

export const hasPermission = (userRole, moduleOrPermission, action) => {
  if (!userRole) return false;
  const permission = action ? `${moduleOrPermission}:${action}` : moduleOrPermission;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};
