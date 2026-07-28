"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Admin User
    const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nxtgen.pavy.ai' },
        update: {},
        create: {
            email: 'admin@nxtgen.pavy.ai',
            passwordHash: adminPasswordHash,
            firstName: 'System',
            lastName: 'Admin',
            role: client_1.UserRole.ADMIN,
            mustChangePassword: false,
        },
    });
    console.log('✅ Admin user created:', admin.email);
    // 2. Demo Student User
    const studentPasswordHash = await bcryptjs_1.default.hash('student123', 10);
    const student = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {},
        create: {
            email: 'student@example.com',
            passwordHash: studentPasswordHash,
            firstName: 'John',
            lastName: 'Doe',
            role: client_1.UserRole.STUDENT,
            mustChangePassword: false,
        },
    });
    console.log('✅ Student user created:', student.email);
    // Give student a subscription & credit balance
    await prisma.subscription.upsert({
        where: { id: 'demo-student-sub' },
        update: {},
        create: {
            id: 'demo-student-sub',
            userId: student.id,
            plan: client_1.SubscriptionPlan.PRO,
            status: 'ACTIVE',
        },
    });
    await prisma.creditBalance.upsert({
        where: { userId: student.id },
        update: {},
        create: {
            userId: student.id,
            totalCredits: 100,
            usedCredits: 15,
        },
    });
    // 3. AI Courses
    const coursesData = [
        {
            title: 'Generative AI Masterclass',
            slug: 'generative-ai-masterclass',
            category: client_1.CourseCategory.AI,
            shortDesc: 'Master LLMs, RAG Pipelines, Multi-Agent Systems, and PyTorch fine-tuning.',
            description: 'Comprehensive 10-week masterclass covering the core engineering practices of generative artificial intelligence, vector databases, LangChain, LlamaIndex, and autonomous agent orchestration.',
            duration: '10 Weeks',
            prerequisites: 'Python basics, fundamental Machine Learning concepts',
            careerOutcomes: 'Generative AI Engineer, LLM Solutions Architect, AI Product Specialist',
            sortOrder: 1,
            modules: [
                { id: 'm1', title: 'Module 1: Prompt Engineering & LLM Architecture', duration: '1 Week', topics: ['Transformer Architecture', 'Prompt Optimization', 'Few-Shot Learning'] },
                { id: 'm2', title: 'Module 2: Vector Databases & RAG Pipelines', duration: '2 Weeks', topics: ['Embeddings', 'Pinecone/Chroma', 'Advanced Retrieval Strategies'] },
                { id: 'm3', title: 'Module 3: Multi-Agent Frameworks (LangGraph & AutoGen)', duration: '2 Weeks', topics: ['Autonomous Agents', 'Tool Calling', 'Stateful Workflows'] },
                { id: 'm4', title: 'Module 4: Model Fine-Tuning (LoRA & QLoRA)', duration: '2 Weeks', topics: ['PEFT Techniques', 'TRL/RLHF', 'Model Evaluation'] },
                { id: 'm5', title: 'Module 5: Production Deployment & MLOps', duration: '1 Week', topics: ['vLLM Server', 'Ollama Deployment', 'Latency Optimization'] },
                { id: 'm6', title: 'Module 6: Capstone Project & Portfolio', duration: '2 Weeks', topics: ['Full-stack AI SaaS App', 'WebSockets', 'Live Production Push'] }
            ]
        },
        {
            title: 'Data Analyst with GenAI',
            slug: 'data-analyst-with-genai',
            category: client_1.CourseCategory.AI,
            shortDesc: 'Automate SQL generation, Pandas workflows, and BI reporting using AI assistants.',
            description: 'Accelerate traditional data analytics workflows using LLMs for automated code generation, natural language database querying, dynamic charts, and executive insights.',
            duration: '12 Weeks',
            prerequisites: 'Basic Excel or SQL awareness',
            careerOutcomes: 'AI-Enhanced Data Analyst, Business Intelligence Specialist, Data Scientist Associate',
            sortOrder: 2,
            modules: [
                { id: 'm1', title: 'Module 1: Modern SQL & Database Foundations', duration: '2 Weeks', topics: ['Complex Queries', 'Window Functions', 'Schema Design'] },
                { id: 'm2', title: 'Module 2: Python Data Stack (Pandas & Polars)', duration: '3 Weeks', topics: ['Data Wrangling', 'Exploratory Data Analysis', 'Visualization'] },
                { id: 'm3', title: 'Module 3: AI Code Interpreters & Data Co-Pilots', duration: '3 Weeks', topics: ['Code Interpreter APIs', 'Automated SQL Generation', 'NLP to SQL'] },
                { id: 'm4', title: 'Module 4: BI Dashboards & Automated Reporting', duration: '4 Weeks', topics: ['Power BI', 'Streamlit Apps', 'Executive AI Summaries'] }
            ]
        },
        {
            title: 'Agentic AI Development',
            slug: 'agentic-ai-development',
            category: client_1.CourseCategory.AI,
            shortDesc: 'Build multi-agent swarms, tool-using bots, and self-healing autonomous workflows.',
            description: 'Deep dive into state-of-the-art agent architectures using CrewAI, LangGraph, and OpenAI Swarm patterns for enterprise workflow automation.',
            duration: '14 Weeks',
            prerequisites: 'Intermediate Python, APIs & WebSockets',
            careerOutcomes: 'Agentic Systems Engineer, Automation Architect, Chief AI Officer',
            sortOrder: 3,
            modules: [
                { id: 'm1', title: 'Module 1: Agentic Primitives & ReAct Loop', duration: '2 Weeks', topics: ['ReAct Pattern', 'Tool Definition', 'Memory Management'] },
                { id: 'm2', title: 'Module 2: CrewAI & Multi-Agent Swarms', duration: '4 Weeks', topics: ['Role-based Agents', 'Delegation Chains', 'Hierarchical Teams'] },
                { id: 'm3', title: 'Module 3: Stateful Graphs with LangGraph', duration: '4 Weeks', topics: ['State Machines', 'Human-in-the-loop', 'Time Travel Debugging'] },
                { id: 'm4', title: 'Module 4: Production Agent Operations (LangSmith)', duration: '4 Weeks', topics: ['Agent Evaluation', 'Cost Management', 'Telemetry'] }
            ]
        },
        {
            title: 'Prompt Engineering Pro',
            slug: 'prompt-engineering-pro',
            category: client_1.CourseCategory.AI,
            shortDesc: 'Master systematic prompt design, red-teaming, guardrails, and structured output.',
            description: 'Comprehensive course on prompt design techniques, JSON mode enforcement, red teaming against adversarial prompts, and system message optimization.',
            duration: '4 Weeks',
            prerequisites: 'None',
            careerOutcomes: 'Prompt Engineer, AI Operations Specialist, AI Content Architect',
            sortOrder: 4,
            modules: [
                { id: 'm1', title: 'Module 1: Advanced Prompting Techniques', duration: '1 Week', topics: ['Chain-of-Thought', 'Tree-of-Thoughts', 'Least-to-Most'] },
                { id: 'm2', title: 'Module 2: Structured Outputs & JSON Schema', duration: '1 Week', topics: ['Pydantic Integration', 'Instructor Library', 'Grammar Enforcers'] },
                { id: 'm3', title: 'Module 3: Guardrails & Red Teaming', duration: '1 Week', topics: ['NeMo Guardrails', 'Prompt Injection Defense', 'PXI Audits'] },
                { id: 'm4', title: 'Module 4: Benchmark & Evaluation Datasets', duration: '1 Week', topics: ['Ragas Framework', 'Eval Metrics', 'A/B Testing Prompts'] }
            ]
        },
        {
            title: 'Azure and SQL DBA Masterclass',
            slug: 'azure-mssql-dba-masterclass',
            category: client_1.CourseCategory.DATABASE,
            shortDesc: 'High-availability, disaster recovery, performance tuning for Microsoft SQL Server & Azure SQL.',
            description: 'Complete database administrator track covering Azure SQL Managed Instances, AlwaysOn Availability Groups, index optimization, and backup strategies.',
            duration: '16 Weeks',
            prerequisites: 'Basic Relational Database Knowledge',
            careerOutcomes: 'Database Administrator (DBA), Cloud Database Engineer, Infrastructure Architect',
            sortOrder: 5,
            modules: [
                { id: 'm1', title: 'Module 1: SQL Server Architecture & Administration', duration: '3 Weeks', topics: ['Storage Engine', 'Transaction Logs', 'TempDB Optimization'] },
                { id: 'm2', title: 'Module 2: High Availability (AlwaysOn & Failover Clusters)', duration: '4 Weeks', topics: ['Availability Groups', 'FCI Setup', 'Log Shipping'] },
                { id: 'm3', title: 'Module 3: Query Store & Performance Tuning', duration: '5 Weeks', topics: ['Index Maintenance', 'Execution Plans', 'Wait Statistics'] },
                { id: 'm4', title: 'Module 4: Azure SQL & Hybrid Cloud Migration', duration: '4 Weeks', topics: ['Azure SQL DB', 'Managed Instance', 'Data Migration Assistant'] }
            ]
        }
    ];
    for (const c of coursesData) {
        await prisma.course.upsert({
            where: { slug: c.slug },
            update: {},
            create: c,
        });
    }
    console.log(`✅ ${coursesData.length} Courses created.`);
    // 4. Sample Internship Programs
    const internships = [
        {
            title: 'Generative AI Internship Program',
            description: 'Hands-on 12-week intensive internship building production-grade Generative AI software, voice bots, and LLM backends with guidance from industry experts.',
            programType: client_1.InternshipType.GENERATIVE_AI,
            duration: '12 Weeks',
            eligibility: 'Passionate coders with basic Python awareness and understanding of API concepts.',
            applicationLink: '/internship',
            learningOutcomes: [
                'Build and deploy full-stack RAG applications',
                'Integrate real-time WebSockets with voice AI models',
                'Master vector database optimization at scale'
            ],
            projectHighlights: [
                { title: 'Build an AI Call Center with LiveKit', description: 'Deploy a ultra-low latency speech-to-speech AI calling agent using WebRTC and LiveKit.' },
                { title: 'Make Your Own AI Receptionist with ElevenLabs', description: 'Develop a conversational AI front-desk receptionist with dynamic tool calling.' }
            ]
        },
        {
            title: 'Agentic AI Internship Program',
            description: 'Advanced 12-week internship focused on building multi-agent autonomous swarms, self-healing code generators, and enterprise workflow automation engines.',
            programType: client_1.InternshipType.AGENTIC_AI,
            duration: '12 Weeks',
            eligibility: 'Intermediate Python developers familiar with LangChain, LangGraph, or CrewAI concepts.',
            applicationLink: '/internship',
            learningOutcomes: [
                'Design complex stateful graphs with human-in-the-loop validation',
                'Implement red-teaming security layers for autonomous agents',
                'Construct multi-agent teams with specialized role delegation'
            ],
            projectHighlights: [
                { title: 'Autonomous DevSwarm Agent', description: 'Build an agent team that reads GitHub issues, writes code, runs unit tests, and submits PRs.' },
                { title: 'Enterprise Financial Analyst Swarm', description: 'Construct a multi-agent pipeline that crawls SEC filings, runs financial models, and exports PDF reports.' }
            ]
        }
    ];
    for (const item of internships) {
        const existing = await prisma.internship.findFirst({ where: { title: item.title } });
        if (!existing) {
            await prisma.internship.create({ data: item });
        }
    }
    console.log(`✅ ${internships.length} Internship programs created.`);
    // 5. Sample Certifications (Populate 10 popular ones)
    const certifications = [
        { name: 'AWS Certified AI Practitioner', provider: 'Amazon Web Services', prerequisite: 'None', link: 'https://aws.amazon.com/certification/' },
        { name: 'Microsoft Certified: Azure AI Engineer Associate', provider: 'Microsoft', prerequisite: 'Azure Fundamentals', link: 'https://learn.microsoft.com/' },
        { name: 'Google Cloud Professional Machine Learning Engineer', provider: 'Google Cloud', prerequisite: 'ML experience', link: 'https://cloud.google.com/certification/' },
        { name: 'Databricks Certified Generative AI Engineer Professional', provider: 'Databricks', prerequisite: 'Python & Spark', link: 'https://www.databricks.com/' },
        { name: 'TensorFlow Developer Certificate', provider: 'DeepLearning.AI', prerequisite: 'Python', link: 'https://www.tensorflow.org/certificate' },
        { name: 'Oracle Cloud Infrastructure AI Certified Professional', provider: 'Oracle', prerequisite: 'OCI Basics', link: 'https://education.oracle.com/' },
        { name: 'Microsoft Certified: Azure Database Administrator Associate', provider: 'Microsoft', prerequisite: 'SQL basics', link: 'https://learn.microsoft.com/' },
        { name: 'PostgreSQL Certified Engineer', provider: 'EnterpriseDB', prerequisite: 'PostgreSQL basics', link: 'https://www.enterprisedb.com/' }
    ];
    for (const cert of certifications) {
        const existing = await prisma.certification.findFirst({ where: { name: cert.name } });
        if (!existing) {
            await prisma.certification.create({ data: cert });
        }
    }
    console.log(`✅ ${certifications.length} Certifications created.`);
    console.log('🎉 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map