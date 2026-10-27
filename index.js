import { Router } from 'express';
import authRoutes from './authRoutes.js';
import businessRoutes from './businessRoutes.js';
import customerRoutes from './customerRoutes.js';
import leadRoutes from './leadRoutes.js';
import productRoutes from './productRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import financeRoutes from './financeRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import marketingRoutes from './marketingRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import platformRoutes from './platformRoutes.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { requireTenant } from '../middleware/tenantMiddleware.js';

const apiRouter = Router();

// Public & User-level routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/platform', platformRoutes);
apiRouter.use('/businesses', businessRoutes);

// Tenant-scoped routers mounted under /businesses/:businessId
const tenantRouter = Router({ mergeParams: true });
tenantRouter.use(authenticate, requireTenant);

tenantRouter.use('/customers', customerRoutes);
tenantRouter.use('/leads', leadRoutes);
tenantRouter.use('/products', productRoutes);
tenantRouter.use('/projects', projectRoutes);
tenantRouter.use('/tasks', taskRoutes);
tenantRouter.use('/finance', financeRoutes);
tenantRouter.use('/invoices', invoiceRoutes);
tenantRouter.use('/inventory', inventoryRoutes);
tenantRouter.use('/campaigns', marketingRoutes);
tenantRouter.use('/reports', reportsRoutes);
tenantRouter.use('/notifications', notificationRoutes);
tenantRouter.use('/subscription', subscriptionRoutes);

apiRouter.use('/businesses/:businessId', tenantRouter);

export default apiRouter;
