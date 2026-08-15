export interface SyllabusModule {
  moduleTitle: string;
  weightagePercent: number;
  topics: string[];
}

export interface ExamOverview {
  examCode: string;
  languages: string[];
  timeLimitMinutes: number;
  passingScore?: string;
  questionCount?: string;
}

export type RoleCategory =
  | 'Cloud Architecture & Admin'
  | 'Data Engineering & Analytics'
  | 'AI & Machine Learning'
  | 'DevOps & Site Reliability'
  | 'Cybersecurity & CyberOps'
  | 'Project Management & Agile'
  | 'Database Administration & SQL';

export const ROLE_CATEGORIES: RoleCategory[] = [
  'Cloud Architecture & Admin',
  'Data Engineering & Analytics',
  'AI & Machine Learning',
  'DevOps & Site Reliability',
  'Cybersecurity & CyberOps',
  'Project Management & Agile',
  'Database Administration & SQL',
];

export interface CertificationItem {
  id: string;
  title: string;
  code: string;
  provider: 'Microsoft' | 'AWS' | 'Google' | 'Cisco' | 'PMI' | 'CompTIA' | 'IBM' | 'Oracle' | 'Red Hat' | 'Salesforce' | 'Linux Foundation' | 'VMware';
  jobRole: string;
  roleCategory: RoleCategory;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[] | null;
  corporateBadge: boolean;
  price?: number;
  popularityScore: number;
  link?: string;
  badgeLogo?: string;
  overview: ExamOverview;
  syllabus: SyllabusModule[];
}

export interface ProviderMeta {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  badgeColor: string;
  accentColor: string;
  logoBg: string;
  tagline: string;
  iconType: string;
}

export const POPULAR_PROVIDERS: ProviderMeta[] = [
  {
    id: 'microsoft',
    name: 'Microsoft',
    slug: 'Microsoft',
    shortName: 'MSFT',
    badgeColor: '#00A4EF',
    accentColor: 'from-blue-600/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    logoBg: 'bg-[#0078D4]/10 text-[#0078D4]',
    tagline: 'Azure, AI & Cloud Infrastructure',
    iconType: 'msft',
  },
  {
    id: 'aws',
    name: 'AWS',
    slug: 'AWS',
    shortName: 'AWS',
    badgeColor: '#FF9900',
    accentColor: 'from-amber-600/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    logoBg: 'bg-[#FF9900]/10 text-[#FF9900]',
    tagline: 'Cloud Architecture & DevOps',
    iconType: 'aws',
  },
  {
    id: 'google',
    name: 'Google',
    slug: 'Google',
    shortName: 'GCP',
    badgeColor: '#4285F4',
    accentColor: 'from-red-500/10 via-yellow-500/10 to-blue-500/20 border-blue-400/30 text-blue-300',
    logoBg: 'bg-[#4285F4]/10 text-[#4285F4]',
    tagline: 'Cloud, ML & Big Data Analytics',
    iconType: 'google',
  },
  {
    id: 'cisco',
    name: 'Cisco',
    slug: 'Cisco',
    shortName: 'CSCO',
    badgeColor: '#1BA0D7',
    accentColor: 'from-cyan-600/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    logoBg: 'bg-[#1BA0D7]/10 text-[#1BA0D7]',
    tagline: 'Networking, CyberOps & DevNet',
    iconType: 'cisco',
  },
  {
    id: 'comptia',
    name: 'CompTIA',
    slug: 'CompTIA',
    shortName: 'CompTIA',
    badgeColor: '#C8232C',
    accentColor: 'from-red-600/20 to-rose-500/10 border-red-500/30 text-red-400',
    logoBg: 'bg-[#C8232C]/10 text-[#C8232C]',
    tagline: 'Security+, CySA+ & Core IT',
    iconType: 'comptia',
  },
  {
    id: 'pmi',
    name: 'PMI',
    slug: 'PMI',
    shortName: 'PMI',
    badgeColor: '#E0234E',
    accentColor: 'from-rose-600/20 to-pink-500/10 border-rose-500/30 text-rose-400',
    logoBg: 'bg-[#E0234E]/10 text-[#E0234E]',
    tagline: 'Project Management & Agile',
    iconType: 'pmi',
  },
  {
    id: 'ibm',
    name: 'IBM',
    slug: 'IBM',
    shortName: 'IBM',
    badgeColor: '#054ADA',
    accentColor: 'from-indigo-600/20 to-blue-500/10 border-indigo-500/30 text-indigo-400',
    logoBg: 'bg-[#054ADA]/10 text-[#054ADA]',
    tagline: 'AI Systems, Cloud & Data',
    iconType: 'ibm',
  },
  {
    id: 'oracle',
    name: 'Oracle',
    slug: 'Oracle',
    shortName: 'ORCL',
    badgeColor: '#F80000',
    accentColor: 'from-red-700/20 to-amber-600/10 border-red-500/30 text-red-400',
    logoBg: 'bg-[#F80000]/10 text-[#F80000]',
    tagline: 'OCI, Autonomous DB & Java',
    iconType: 'oracle',
  },
  {
    id: 'redhat',
    name: 'Red Hat',
    slug: 'Red Hat',
    shortName: 'RHAT',
    badgeColor: '#EE0000',
    accentColor: 'from-red-600/20 to-rose-600/10 border-red-500/30 text-red-400',
    logoBg: 'bg-[#EE0000]/10 text-[#EE0000]',
    tagline: 'Enterprise Linux & OpenShift',
    iconType: 'redhat',
  },
  {
    id: 'vmware',
    name: 'VMware',
    slug: 'VMware',
    shortName: 'VMW',
    badgeColor: '#607078',
    accentColor: 'from-slate-600/20 to-gray-500/10 border-slate-500/30 text-slate-300',
    logoBg: 'bg-[#607078]/10 text-[#607078]',
    tagline: 'vSphere Virtualization & Cloud',
    iconType: 'vmware',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    slug: 'Salesforce',
    shortName: 'SFDC',
    badgeColor: '#00A1E0',
    accentColor: 'from-sky-600/20 to-cyan-500/10 border-sky-500/30 text-sky-400',
    logoBg: 'bg-[#00A1E0]/10 text-[#00A1E0]',
    tagline: 'CRM, Apex, LWC & Einstein AI',
    iconType: 'salesforce',
  },
  {
    id: 'linuxfoundation',
    name: 'Linux Foundation',
    slug: 'Linux Foundation',
    shortName: 'LF',
    badgeColor: '#003366',
    accentColor: 'from-blue-700/20 to-indigo-500/10 border-blue-600/30 text-blue-300',
    logoBg: 'bg-[#003366]/10 text-[#003366]',
    tagline: 'Kubernetes CKA, CKAD & CKS',
    iconType: 'linuxfoundation',
  },
];

// Helper builder
const makeItem = (
  id: string,
  title: string,
  code: string,
  provider: CertificationItem['provider'],
  jobRole: string,
  roleCategory: RoleCategory,
  level: 'Beginner' | 'Intermediate' | 'Advanced',
  prerequisites: string[] | null,
  popularityScore: number,
  link: string,
  timeLimitMinutes = 90,
  modules: Array<{ moduleTitle: string; weightagePercent: number; topics: string[] }> = [
    { moduleTitle: 'Architecture & Core Principles', weightagePercent: 35, topics: ['Core Concepts', 'Scalability & Reliability', 'Security & Best Practices'] },
    { moduleTitle: 'Implementation & Configuration', weightagePercent: 40, topics: ['Hands-on Deployment', 'Automation & Tooling', 'Troubleshooting'] },
    { moduleTitle: 'Operations & Optimization', weightagePercent: 25, topics: ['Monitoring & Logging', 'Performance Tuning', 'Governance'] },
  ]
): CertificationItem => ({
  id,
  title,
  code,
  provider,
  jobRole,
  roleCategory,
  level,
  prerequisites,
  corporateBadge: true,
  popularityScore,
  link,
  overview: {
    examCode: code,
    languages: ['English', 'Japanese', 'Spanish', 'German', 'French'],
    timeLimitMinutes,
    passingScore: '700 / 1000',
    questionCount: '50-65 Questions',
  },
  syllabus: modules,
});

export const CERTIFICATIONS_CATALOG: CertificationItem[] = [
  // ─── MICROSOFT / AZURE ───
  makeItem('az-900', 'Microsoft Certified: Azure Fundamentals', 'AZ-900', 'Microsoft', 'Cloud Support Specialist', 'Cloud Architecture & Admin', 'Beginner', null, 99, 'https://learn.microsoft.com/credentials/certifications/azure-fundamentals/', 65, [
    { moduleTitle: 'Cloud Concepts & Principles', weightagePercent: 30, topics: ['High Availability', 'Scalability & Elasticity', 'IaaS vs PaaS vs SaaS', 'CapEx vs OpEx'] },
    { moduleTitle: 'Azure Architecture & Core Services', weightagePercent: 40, topics: ['Virtual Machines & App Services', 'Virtual Networks & VPN', 'Blob & Disk Storage', 'Azure Cosmos DB'] },
    { moduleTitle: 'Azure Management & Governance', weightagePercent: 30, topics: ['Azure Policy & RBAC', 'Cost Management tools', 'Resource Manager (ARM)', 'Azure Monitor'] },
  ]),

  makeItem('dp-900', 'Microsoft Certified: Azure Data Fundamentals', 'DP-900', 'Microsoft', 'Data Analyst / Junior DBA', 'Data Engineering & Analytics', 'Beginner', null, 94, 'https://learn.microsoft.com/credentials/certifications/azure-data-fundamentals/', 65, [
    { moduleTitle: 'Core Data Concepts', weightagePercent: 30, topics: ['Relational vs Non-Relational Data', 'Batch vs Streaming workloads', 'Data Visualization basics'] },
    { moduleTitle: 'Relational Data in Azure', weightagePercent: 35, topics: ['Azure SQL Database', 'Managed Instance', 'PostgreSQL & MySQL'] },
    { moduleTitle: 'Analytics & Big Data Workloads', weightagePercent: 35, topics: ['Azure Synapse Analytics', 'Azure Databricks', 'Power BI integration'] },
  ]),

  makeItem('ai-900', 'Microsoft Certified: Azure AI Fundamentals', 'AI-900', 'Microsoft', 'AI Product Specialist', 'AI & Machine Learning', 'Beginner', null, 96, 'https://learn.microsoft.com/credentials/certifications/azure-ai-fundamentals/', 65, [
    { moduleTitle: 'AI Workloads & Principles', weightagePercent: 25, topics: ['Computer Vision', 'Natural Language Processing', 'Conversational AI', 'Responsible AI'] },
    { moduleTitle: 'Machine Learning on Azure', weightagePercent: 35, topics: ['Azure ML Studio', 'Automated ML', 'Visual Pipeline Designer'] },
    { moduleTitle: 'Generative AI & Azure OpenAI', weightagePercent: 40, topics: ['Azure OpenAI Service', 'Prompt Engineering Fundamentals', 'Content Filtering'] },
  ]),

  makeItem('az-104', 'Microsoft Certified: Azure Administrator Associate', 'AZ-104', 'Microsoft', 'Cloud Infrastructure Engineer', 'Cloud Architecture & Admin', 'Intermediate', ['AZ-900 or equivalent hands-on Azure experience'], 98, 'https://learn.microsoft.com/credentials/certifications/azure-administrator/', 100, [
    { moduleTitle: 'Manage Azure Identities & Governance', weightagePercent: 20, topics: ['Microsoft Entra ID', 'Conditional Access', 'RBAC & Subscriptions'] },
    { moduleTitle: 'Deploy Compute & Storage', weightagePercent: 35, topics: ['Azure VMs & Scale Sets', 'Azure Container Instances & AKS', 'Blob Storage & Files'] },
    { moduleTitle: 'Configure Virtual Networking', weightagePercent: 30, topics: ['VNet Peering & Subnets', 'NSGs & Azure Firewall', 'Load Balancers & Application Gateway'] },
    { moduleTitle: 'Monitor & Maintain Azure Resources', weightagePercent: 15, topics: ['Azure Monitor & Log Analytics', 'Alerts & Metrics', 'Azure Backup'] },
  ]),

  makeItem('az-204', 'Microsoft Certified: Azure Developer Associate', 'AZ-204', 'Microsoft', 'Cloud Backend Engineer', 'DevOps & Site Reliability', 'Intermediate', ['Experience with C#, Java, or Python'], 93, 'https://learn.microsoft.com/credentials/certifications/azure-developer/', 100, [
    { moduleTitle: 'Develop Azure Compute Solutions', weightagePercent: 35, topics: ['Azure App Services', 'Azure Functions (Serverless)', 'Docker & Container Apps'] },
    { moduleTitle: 'Implement Azure Security & Storage', weightagePercent: 30, topics: ['Microsoft Identity Platform OAuth2', 'Key Vault SDK', 'Cosmos DB SDK Integration'] },
    { moduleTitle: 'Connect & Consume Azure Services', weightagePercent: 35, topics: ['Event Grid & Event Hubs', 'Service Bus Queues', 'API Management'] },
  ]),

  makeItem('az-500', 'Microsoft Certified: Azure Security Engineer Associate', 'AZ-500', 'Microsoft', 'Cloud Security Engineer', 'Cybersecurity & CyberOps', 'Intermediate', ['AZ-104 or equivalent security knowledge'], 92, 'https://learn.microsoft.com/credentials/certifications/azure-security-engineer/', 100, [
    { moduleTitle: 'Manage Identity and Access', weightagePercent: 28, topics: ['Privileged Identity Management (PIM)', 'Identity Protection', 'App Registration'] },
    { moduleTitle: 'Secure Networking & Compute', weightagePercent: 40, topics: ['Azure DDoS & WAF', 'NSG Bastion Hosts', 'Disk Encryption & SQL TDE'] },
    { moduleTitle: 'Security Operations & SIEM', weightagePercent: 32, topics: ['Defender for Cloud', 'Microsoft Sentinel SIEM/SOAR', 'Compliance Audits'] },
  ]),

  makeItem('az-305', 'Microsoft Certified: Azure Solutions Architect Expert', 'AZ-305', 'Microsoft', 'Principal Solutions Architect', 'Cloud Architecture & Admin', 'Advanced', ['AZ-104 Azure Administrator Associate (Required)'], 97, 'https://learn.microsoft.com/credentials/certifications/azure-solutions-architect/', 100, [
    { moduleTitle: 'Design Identity, Governance & Monitoring', weightagePercent: 26, topics: ['Cross-tenant Access', 'Governance Hierarchies', 'Telemetry Patterns'] },
    { moduleTitle: 'Design Data Storage & Business Continuity', weightagePercent: 46, topics: ['Relational/NoSQL Design', 'Multi-Region HA & Disaster Recovery'] },
    { moduleTitle: 'Design Infrastructure & Migration', weightagePercent: 28, topics: ['Microservices on AKS', 'Hybrid Networking', 'Cloud Migration Strategy'] },
  ]),

  makeItem('az-400', 'Microsoft Certified: DevOps Engineer Expert', 'AZ-400', 'Microsoft', 'DevOps Platform Architect', 'DevOps & Site Reliability', 'Advanced', ['AZ-104 or AZ-204 Associate'], 95, 'https://learn.microsoft.com/credentials/certifications/devops-engineer/', 100, [
    { moduleTitle: 'Design & Implement Build/Release Pipelines', weightagePercent: 40, topics: ['Azure DevOps & GitHub Actions', 'Multi-Stage Deployment Gates', 'Infrastructure as Code'] },
    { moduleTitle: 'Implement Security & Compliance Plan', weightagePercent: 30, topics: ['Secret Scanning', 'Container Image Vulnerability Scanning', 'Dependency Management'] },
    { moduleTitle: 'Instrumentation & SRE Strategy', weightagePercent: 30, topics: ['Application Insights', 'Telemetry Loops', 'Chaos Testing'] },
  ]),

  makeItem('dp-203', 'Microsoft Certified: Azure Data Engineer Associate', 'DP-203', 'Microsoft', 'Senior Data Engineer', 'Data Engineering & Analytics', 'Intermediate', ['DP-900 or SQL & Python experience'], 94, 'https://learn.microsoft.com/credentials/certifications/azure-data-engineer/', 100, [
    { moduleTitle: 'Design & Implement Data Storage', weightagePercent: 30, topics: ['Data Lake Gen2 Partitioning', 'Synapse Dedicated SQL Pools', 'Delta Lake'] },
    { moduleTitle: 'Develop Data Processing Pipelines', weightagePercent: 45, topics: ['Azure Synapse Data Flows', 'Azure Databricks Spark', 'Stream Analytics'] },
    { moduleTitle: 'Data Security & Optimization', weightagePercent: 25, topics: ['Dynamic Data Masking', 'Row-Level Security', 'Execution Tuning'] },
  ]),

  makeItem('ai-102', 'Microsoft Certified: Azure AI Engineer Associate', 'AI-102', 'Microsoft', 'Applied AI Engineer', 'AI & Machine Learning', 'Intermediate', ['AI-900 and Python / C# knowledge'], 95, 'https://learn.microsoft.com/credentials/certifications/azure-ai-engineer/', 100, [
    { moduleTitle: 'Implement Computer Vision & Document AI', weightagePercent: 30, topics: ['Azure AI Vision OCR', 'Custom Vision', 'Document Intelligence (Form Recognizer)'] },
    { moduleTitle: 'Natural Language Processing & Search', weightagePercent: 35, topics: ['Azure AI Language', 'Vector Indexing in Azure AI Search', 'Conversational AI'] },
    { moduleTitle: 'Generative AI & LLM Solutions', weightagePercent: 35, topics: ['Azure OpenAI RAG Pipelines', 'LangChain & Semantic Kernel', 'Prompt Optimization'] },
  ]),

  // ─── AWS (AMAZON WEB SERVICES) ───
  makeItem('aws-clf-c02', 'AWS Certified Cloud Practitioner', 'CLF-C02', 'AWS', 'Cloud Associate', 'Cloud Architecture & Admin', 'Beginner', null, 99, 'https://aws.amazon.com/certification/certified-cloud-practitioner/', 90),
  makeItem('aws-saa-c03', 'AWS Certified Solutions Architect – Associate', 'SAA-C03', 'AWS', 'Cloud Solutions Architect', 'Cloud Architecture & Admin', 'Intermediate', ['1+ year hands-on AWS experience recommended'], 100, 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', 130),
  makeItem('aws-dva-c02', 'AWS Certified Developer – Associate', 'DVA-C02', 'AWS', 'Serverless Cloud Developer', 'DevOps & Site Reliability', 'Intermediate', ['Experience with Python, Node.js or Java'], 94, 'https://aws.amazon.com/certification/certified-developer-associate/', 130),
  makeItem('aws-soa-c02', 'AWS Certified SysOps Administrator – Associate', 'SOA-C02', 'AWS', 'Cloud Systems Administrator', 'Cloud Architecture & Admin', 'Intermediate', ['Linux administration & AWS operations experience'], 91, 'https://aws.amazon.com/certification/certified-sysops-admin-associate/', 130),
  makeItem('aws-sap-c02', 'AWS Certified Solutions Architect – Professional', 'SAP-C02', 'AWS', 'Principal Cloud Architect', 'Cloud Architecture & Admin', 'Advanced', ['2+ years enterprise AWS architecture experience'], 98, 'https://aws.amazon.com/certification/certified-solutions-architect-professional/', 180),
  makeItem('aws-dop-c02', 'AWS Certified DevOps Engineer – Professional', 'DOP-C02', 'AWS', 'Lead Platform Engineer', 'DevOps & Site Reliability', 'Advanced', ['AWS Developer or SysOps Associate recommended'], 96, 'https://aws.amazon.com/certification/certified-devops-engineer-professional/', 180),
  makeItem('aws-dea-c01', 'AWS Certified Data Engineer – Associate', 'DEA-C01', 'AWS', 'Big Data Pipeline Engineer', 'Data Engineering & Analytics', 'Intermediate', ['Hands-on SQL, Python & ETL experience'], 97, 'https://aws.amazon.com/certification/certified-data-engineer-associate/', 130),
  makeItem('aws-mls-c01', 'AWS Certified Machine Learning – Specialty', 'MLS-C01', 'AWS', 'Machine Learning Engineer', 'AI & Machine Learning', 'Advanced', ['1-2 years ML workload deployment experience'], 95, 'https://aws.amazon.com/certification/certified-machine-learning-specialty/', 180),
  makeItem('aws-scs-c02', 'AWS Certified Security – Specialty', 'SCS-C02', 'AWS', 'Cloud Security Architect', 'Cybersecurity & CyberOps', 'Advanced', ['2+ years securing AWS workloads'], 94, 'https://aws.amazon.com/certification/certified-security-specialty/', 170),
  makeItem('aws-ans-c01', 'AWS Certified Advanced Networking – Specialty', 'ANS-C01', 'AWS', 'Network Infrastructure Architect', 'Cloud Architecture & Admin', 'Advanced', ['Advanced routing, Direct Connect & Transit Gateway'], 93, 'https://aws.amazon.com/certification/certified-advanced-networking-specialty/', 170),

  // ─── GOOGLE CLOUD (GCP) ───
  makeItem('gcp-cdl', 'Google Cloud Digital Leader', 'GCP-CDL', 'Google', 'Digital Transformation Consultant', 'Cloud Architecture & Admin', 'Beginner', null, 90, 'https://cloud.google.com/learn/certification/cloud-digital-leader', 90),
  makeItem('gcp-ace', 'Google Cloud Associate Cloud Engineer', 'GCP-ACE', 'Google', 'GCP Operations Engineer', 'Cloud Architecture & Admin', 'Intermediate', ['6+ months hands-on GCP experience'], 97, 'https://cloud.google.com/learn/certification/cloud-engineer', 120),
  makeItem('gcp-pca', 'Google Cloud Professional Cloud Architect', 'GCP-PCA', 'Google', 'Enterprise Cloud Architect', 'Cloud Architecture & Admin', 'Advanced', ['3+ years cloud architecture experience'], 99, 'https://cloud.google.com/learn/certification/cloud-architect', 120),
  makeItem('gcp-pde', 'Google Cloud Professional Data Engineer', 'GCP-PDE', 'Google', 'Big Data Solutions Architect', 'Data Engineering & Analytics', 'Advanced', ['3+ years data engineering on GCP'], 96, 'https://cloud.google.com/learn/certification/data-engineer', 120),
  makeItem('gcp-pmle', 'Google Cloud Professional Machine Learning Engineer', 'GCP-PMLE', 'Google', 'AI Systems Architect', 'AI & Machine Learning', 'Advanced', ['Vertex AI, TensorFlow & Kubeflow experience'], 95, 'https://cloud.google.com/learn/certification/machine-learning-engineer', 120),
  makeItem('gcp-pcd', 'Google Cloud Professional Cloud Developer', 'GCP-PCD', 'Google', 'Cloud Native App Developer', 'DevOps & Site Reliability', 'Advanced', ['Containerization & microservices on GCP'], 92, 'https://cloud.google.com/learn/certification/cloud-developer', 120),
  makeItem('gcp-pcse', 'Google Cloud Professional Cloud Security Engineer', 'GCP-PCSE', 'Google', 'Cloud Security Specialist', 'Cybersecurity & CyberOps', 'Advanced', ['IAM, Cloud Armor & Zero-Trust on GCP'], 93, 'https://cloud.google.com/learn/certification/cloud-security-engineer', 120),
  makeItem('gcp-pcne', 'Google Cloud Professional Cloud Network Engineer', 'GCP-PCNE', 'Google', 'Hybrid Cloud Network Architect', 'Cloud Architecture & Admin', 'Advanced', ['VPC Peering, Interconnect & Cloud CDN'], 91, 'https://cloud.google.com/learn/certification/cloud-network-engineer', 120),
  makeItem('gcp-pcdbe', 'Google Cloud Professional Cloud Database Engineer', 'GCP-PCDBE', 'Google', 'Cloud Database Administrator', 'Database Administration & SQL', 'Advanced', ['Cloud Spanner, Bigtable, Cloud SQL & AlloyDB'], 92, 'https://cloud.google.com/learn/certification/cloud-database-engineer', 120),

  // ─── CISCO ───
  makeItem('cisco-ccna', 'Cisco Certified Network Associate (CCNA)', '200-301 CCNA', 'Cisco', 'Network Support Engineer', 'Cloud Architecture & Admin', 'Beginner', null, 100, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html', 120),
  makeItem('cisco-ccnp-enterprise', 'Cisco Certified Network Professional (CCNP) Enterprise', '350-401 ENCOR', 'Cisco', 'Senior Network Engineer', 'Cloud Architecture & Admin', 'Intermediate', ['CCNA recommended or 3+ years routing/switching'], 97, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/professional/ccnp-enterprise.html', 120),
  makeItem('cisco-ccnp-security', 'Cisco Certified Network Professional (CCNP) Security', '350-701 SCOR', 'Cisco', 'Network Security Architect', 'Cybersecurity & CyberOps', 'Intermediate', ['3-5 years networking & security experience'], 95, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/professional/ccnp-security.html', 120),
  makeItem('cisco-ccnp-datacenter', 'Cisco Certified Network Professional (CCNP) Data Center', '350-601 DCCOR', 'Cisco', 'Data Center Network Specialist', 'Cloud Architecture & Admin', 'Intermediate', ['Cisco Nexus, ACI & UCS experience'], 91, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/professional/ccnp-data-center.html', 120),
  makeItem('cisco-ccie-enterprise', 'Cisco Certified Internetwork Expert (CCIE) Enterprise', 'CCIE Enterprise', 'Cisco', 'Principal Network Architect', 'Cloud Architecture & Admin', 'Advanced', ['Pass 350-401 ENCOR + 8-hour Practical Lab Exam'], 98, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/expert/ccie-enterprise-infrastructure.html', 480),
  makeItem('cisco-cyberops-assoc', 'Cisco Certified CyberOps Associate', '200-201 CBROPS', 'Cisco', 'SOC Tier 1 Analyst', 'Cybersecurity & CyberOps', 'Beginner', null, 93, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/cyberops-associate.html', 120),
  makeItem('cisco-devnet-assoc', 'Cisco Certified DevNet Associate', '200-901 DEVASC', 'Cisco', 'Network Automation Engineer', 'DevOps & Site Reliability', 'Beginner', null, 92, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/devnet-associate.html', 120),
  makeItem('cisco-devnet-prof', 'Cisco Certified DevNet Professional', '350-901 DEVCOR', 'Cisco', 'DevNet Solutions Architect', 'DevOps & Site Reliability', 'Advanced', ['3-5 years Python automation & APIs'], 94, 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/professional/devnet-professional.html', 120),

  // ─── COMPTIA ───
  makeItem('comptia-sec-plus', 'CompTIA Security+', 'SY0-701', 'CompTIA', 'Information Security Specialist', 'Cybersecurity & CyberOps', 'Beginner', ['CompTIA Network+ or 2 years IT experience recommended'], 100, 'https://www.comptia.org/certifications/security', 90),
  makeItem('comptia-net-plus', 'CompTIA Network+', 'N10-009', 'CompTIA', 'Network Systems Administrator', 'Cloud Architecture & Admin', 'Beginner', null, 96, 'https://www.comptia.org/certifications/network', 90),
  makeItem('comptia-a-plus', 'CompTIA A+', '220-1101 / 220-1102', 'CompTIA', 'IT Support Technician', 'Cloud Architecture & Admin', 'Beginner', null, 95, 'https://www.comptia.org/certifications/a', 90),
  makeItem('comptia-cysa-plus', 'CompTIA Cybersecurity Analyst (CySA+)', 'CS0-003', 'CompTIA', 'Threat Intelligence Analyst', 'Cybersecurity & CyberOps', 'Intermediate', ['CompTIA Security+ recommended'], 94, 'https://www.comptia.org/certifications/cybersecurity-analyst', 165),
  makeItem('comptia-pentest-plus', 'CompTIA PenTest+', 'PT0-002', 'CompTIA', 'Penetration Tester / Ethical Hacker', 'Cybersecurity & CyberOps', 'Intermediate', ['CompTIA Security+ or 3-4 years experience'], 92, 'https://www.comptia.org/certifications/pentest', 165),
  makeItem('comptia-casp-plus', 'CompTIA Advanced Security Practitioner (CASP+)', 'CAS-004', 'CompTIA', 'Chief Security Architect', 'Cybersecurity & CyberOps', 'Advanced', ['10 years IT administration, 5 years security'], 95, 'https://www.comptia.org/certifications/comptia-advanced-security-practitioner', 165),
  makeItem('comptia-cloud-plus', 'CompTIA Cloud+', 'CV0-004', 'CompTIA', 'Multi-Cloud Infrastructure Specialist', 'Cloud Architecture & Admin', 'Intermediate', ['2-3 years systems administration'], 90, 'https://www.comptia.org/certifications/cloud', 90),
  makeItem('comptia-linux-plus', 'CompTIA Linux+', 'XK0-005', 'CompTIA', 'Linux Systems Administrator', 'DevOps & Site Reliability', 'Intermediate', ['12 months Linux server administration'], 93, 'https://www.comptia.org/certifications/linux', 90),
  makeItem('comptia-data-plus', 'CompTIA Data+', 'DA0-001', 'CompTIA', 'Data Operations Analyst', 'Data Engineering & Analytics', 'Beginner', null, 89, 'https://www.comptia.org/certifications/data', 90),

  // ─── PMI ───
  makeItem('pmi-pmp', 'Project Management Professional (PMP)®', 'PMP', 'PMI', 'Senior Project Manager', 'Project Management & Agile', 'Advanced', ['3-5 years PM leadership + 35 contact hours PM education'], 100, 'https://www.pmi.org/certifications/project-management-pmp', 230),
  makeItem('pmi-capm', 'Certified Associate in Project Management (CAPM)®', 'CAPM', 'PMI', 'Project Coordinator', 'Project Management & Agile', 'Beginner', ['Secondary degree + 23 hours PM education'], 92, 'https://www.pmi.org/certifications/certified-associate-capm', 180),
  makeItem('pmi-acp', 'PMI Agile Certified Practitioner (PMI-ACP)®', 'PMI-ACP', 'PMI', 'Enterprise Agile Coach / Scrum Master', 'Project Management & Agile', 'Intermediate', ['21 contact hours agile + 12 months project experience'], 94, 'https://www.pmi.org/certifications/agile-acp', 180),
  makeItem('pmi-pba', 'PMI Professional in Business Analysis (PMI-PBA)®', 'PMI-PBA', 'PMI', 'Senior Business Analyst', 'Project Management & Agile', 'Intermediate', ['3+ years business analysis experience'], 90, 'https://www.pmi.org/certifications/business-analysis-pba', 240),

  // ─── IBM ───
  makeItem('ibm-cloud-advocate', 'IBM Cloud Advocate', 'C1000-142', 'IBM', 'IBM Cloud Consultant', 'Cloud Architecture & Admin', 'Beginner', null, 88, 'https://www.ibm.com/training/certification#ibm-cloud-advocate', 90),
  makeItem('ibm-data-science', 'IBM Data Science Professional', 'IBM-DSP', 'IBM', 'Data Scientist / Modeler', 'Data Engineering & Analytics', 'Intermediate', ['Python and statistics experience'], 93, 'https://www.ibm.com/training/certification#ibm-data-science-professional', 120),
  makeItem('ibm-ai-workflow', 'IBM AI Enterprise Workflow', 'IBM-AIEW', 'IBM', 'Enterprise AI Architect', 'AI & Machine Learning', 'Advanced', ['Enterprise ML pipelines and Cloud Pak for Data'], 91, 'https://www.ibm.com/training/certification#ibm-ai-enterprise-workflow', 120),
  makeItem('ibm-cybersecurity', 'IBM Cybersecurity Analyst', 'IBM-CYBER', 'IBM', 'SOC Security Analyst', 'Cybersecurity & CyberOps', 'Beginner', null, 89, 'https://www.ibm.com/training/certification#ibm-cybersecurity-analyst', 90),
  makeItem('ibm-quantum-dev', 'IBM Quantum Developer', 'IBM-QUANTUM', 'IBM', 'Quantum Algorithms Engineer', 'AI & Machine Learning', 'Advanced', ['Qiskit and linear algebra foundations'], 90, 'https://www.ibm.com/training/certification#ibm-quantum-developer', 90),

  // ─── ORACLE ───
  makeItem('oracle-oci-foundations', 'Oracle Cloud Infrastructure Foundations Associate', '1Z0-1085-24', 'Oracle', 'OCI Cloud Consultant', 'Cloud Architecture & Admin', 'Beginner', null, 92, 'https://education.oracle.com/oracle-cloud-infrastructure-2024-foundations-associate/pexam_1Z0-1085-24', 90),
  makeItem('oracle-oci-architect-assoc', 'Oracle Cloud Infrastructure Architect Associate', '1Z0-1072-24', 'Oracle', 'OCI Solutions Architect', 'Cloud Architecture & Admin', 'Intermediate', ['1Z0-1085 or 6+ months hands-on OCI experience'], 95, 'https://education.oracle.com/oracle-cloud-infrastructure-2024-architect-associate/pexam_1Z0-1072-24', 90),
  makeItem('oracle-autonomous-db', 'Oracle Autonomous Database Cloud Professional', '1Z0-931-24', 'Oracle', 'Autonomous Database Administrator', 'Database Administration & SQL', 'Intermediate', ['SQL and Oracle DB architecture knowledge'], 94, 'https://education.oracle.com/oracle-autonomous-database-cloud-2024-professional/pexam_1Z0-931-24', 90),
  makeItem('oracle-mysql-dba', 'Oracle MySQL 8.0 Database Administrator', '1Z0-908', 'Oracle', 'MySQL DBA / Performance Specialist', 'Database Administration & SQL', 'Intermediate', ['2+ years MySQL database administration'], 91, 'https://education.oracle.com/mysql-80-database-administrator/pexam_1Z0-908', 120),
  makeItem('oracle-sql-assoc', 'Oracle Database SQL Certified Associate', '1Z0-071', 'Oracle', 'SQL Database Developer', 'Database Administration & SQL', 'Beginner', null, 93, 'https://education.oracle.com/oracle-database-sql/pexam_1Z0-071', 120),
  makeItem('oracle-java-se11', 'Oracle Certified Professional: Java SE 11 Developer', '1Z0-819', 'Oracle', 'Senior Java Backend Engineer', 'DevOps & Site Reliability', 'Intermediate', ['Solid Java SE OOP and functional programming'], 92, 'https://education.oracle.com/java-se-11-developer/pexam_1Z0-819', 90),

  // ─── RED HAT ───
  makeItem('rh-rhcsa', 'Red Hat Certified System Administrator (RHCSA)', 'EX200', 'Red Hat', 'Red Hat Linux Administrator', 'Cloud Architecture & Admin', 'Beginner', null, 98, 'https://www.redhat.com/en/services/certification/rhcsa', 180),
  makeItem('rh-rhce', 'Red Hat Certified Engineer (RHCE - Ansible Automation)', 'EX294', 'Red Hat', 'Linux Automation Architect', 'DevOps & Site Reliability', 'Advanced', ['Must hold active RHCSA'], 96, 'https://www.redhat.com/en/services/certification/rhce', 240),
  makeItem('rh-openshift', 'Red Hat Certified Specialist in OpenShift Administration', 'EX280', 'Red Hat', 'OpenShift Cluster Administrator', 'DevOps & Site Reliability', 'Advanced', ['RHCSA or Kubernetes administration experience'], 95, 'https://www.redhat.com/en/services/certification/rhcs-openshift-administration', 180),

  // ─── VMWARE ───
  makeItem('vmw-vcp-dcv', 'VMware Certified Professional - Data Center Virtualization', 'VCP-DCV', 'VMware', 'vSphere Virtualization Engineer', 'Cloud Architecture & Admin', 'Intermediate', ['vSphere 8 installation & management'], 94, 'https://www.vmware.com/learning/certification/vcp-dcv.html', 135),
  makeItem('vmw-vcp-nv', 'VMware Certified Professional - Network Virtualization', 'VCP-NV', 'VMware', 'NSX-T Network Architect', 'Cloud Architecture & Admin', 'Advanced', ['VMware NSX-T network virtualization'], 92, 'https://www.vmware.com/learning/certification/vcp-nv.html', 135),

  // ─── SALESFORCE ───
  makeItem('sf-admin', 'Salesforce Certified Administrator', 'SF-ADMIN', 'Salesforce', 'Salesforce Systems Administrator', 'Cloud Architecture & Admin', 'Beginner', null, 96, 'https://trailhead.salesforce.com/credentials/administrator', 105),
  makeItem('sf-dev-1', 'Salesforce Certified Platform Developer I', 'SF-DEV1', 'Salesforce', 'Salesforce Apex & LWC Developer', 'DevOps & Site Reliability', 'Intermediate', ['Apex & Lightning Web Components'], 94, 'https://trailhead.salesforce.com/credentials/platformdeveloperi', 105),
  makeItem('sf-ai-assoc', 'Salesforce Certified AI Associate', 'SF-AI', 'Salesforce', 'Einstein AI Specialist', 'AI & Machine Learning', 'Beginner', null, 93, 'https://trailhead.salesforce.com/credentials/ai-associate', 70),

  // ─── LINUX FOUNDATION ───
  makeItem('lf-cka', 'Certified Kubernetes Administrator (CKA)', 'CKA', 'Linux Foundation', 'Kubernetes Platform Engineer', 'DevOps & Site Reliability', 'Intermediate', ['Linux CLI and Docker fundamentals'], 99, 'https://www.cncf.io/certification/cka/', 120),
  makeItem('lf-ckad', 'Certified Kubernetes Application Developer (CKAD)', 'CKAD', 'Linux Foundation', 'Cloud Native App Developer', 'DevOps & Site Reliability', 'Intermediate', ['Containerized application architecture'], 95, 'https://www.cncf.io/certification/ckad/', 120),
  makeItem('lf-cks', 'Certified Kubernetes Security Specialist (CKS)', 'CKS', 'Linux Foundation', 'Container Security Engineer', 'Cybersecurity & CyberOps', 'Advanced', ['Must hold active CKA certification'], 97, 'https://www.cncf.io/certification/cks/', 120),
];
