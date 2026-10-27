export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Workspace',
    priceMonthlyMinor: 0,
    priceYearlyMinor: 0,
    currency: 'USD',
    description: 'Perfect for solo entrepreneurs and early-stage testing.',
    limits: {
      maxTeamMembers: 2,
      maxCustomers: 25,
      maxProjects: 3,
      maxInvoicesPerMonth: 10,
      inventoryEnabled: false,
      marketingEnabled: false,
      exportEnabled: false,
    },
    features: [
      'Up to 2 team members',
      '25 customers & contacts',
      '3 active projects',
      '10 monthly invoices',
      'Standard business dashboard',
      'Email support'
    ]
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthlyMinor: 2900, // $29.00
    priceYearlyMinor: 29000, // $290.00
    currency: 'USD',
    description: 'Essential toolkit for growing micro-businesses and boutique agencies.',
    limits: {
      maxTeamMembers: 5,
      maxCustomers: 250,
      maxProjects: 20,
      maxInvoicesPerMonth: 100,
      inventoryEnabled: true,
      marketingEnabled: false,
      exportEnabled: true,
    },
    features: [
      'Up to 5 team members',
      '250 customers & CRM',
      '20 active projects & milestones',
      'Unlimited invoices & payments',
      'Basic inventory tracking',
      'CSV reports export',
      'Priority email support'
    ]
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthlyMinor: 7900, // $79.00
    priceYearlyMinor: 79000, // $790.00
    currency: 'USD',
    description: 'Advanced operations, inventory management, and marketing tracking for expanding teams.',
    limits: {
      maxTeamMembers: 20,
      maxCustomers: 1500,
      maxProjects: 100,
      maxInvoicesPerMonth: 1000,
      inventoryEnabled: true,
      marketingEnabled: true,
      exportEnabled: true,
    },
    features: [
      'Up to 20 team members',
      '1,500 customers & leads',
      '100 active projects',
      'Full inventory with movement audit',
      'Marketing campaign attribution',
      'Financial reports & cash flow summaries',
      'Role-based granular access'
    ]
  },
  business: {
    id: 'business',
    name: 'Enterprise / Business',
    priceMonthlyMinor: 19900, // $199.00
    priceYearlyMinor: 199000, // $1990.00
    currency: 'USD',
    description: 'Uncapped scale, highest limits, and dedicated operational governance.',
    limits: {
      maxTeamMembers: 100,
      maxCustomers: 10000,
      maxProjects: 500,
      maxInvoicesPerMonth: 10000,
      inventoryEnabled: true,
      marketingEnabled: true,
      exportEnabled: true,
    },
    features: [
      'Up to 100 team members',
      '10,000+ customers & leads',
      '500 projects with unlimited tasks',
      'Advanced multi-tier inventory',
      'Multi-channel marketing campaigns',
      'Custom invoice branding & PDFs',
      'Dedicated audit logs & 24/7 priority support'
    ]
  }
};
