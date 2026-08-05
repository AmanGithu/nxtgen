import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { extractPdfText } from '../src/services/resume/textExtract';

const prisma = new PrismaClient();

const PDF = '/Users/abhijeet/nxtgen/Screenshots/certification.pdf';

/* Page furniture and the stray column numbers the extractor emits. */
const isNoise = (line: string) =>
  !line ||
  /^\d+$/.test(line) ||
  /^--\s*\d+\s*of\s*\d+\s*--$/.test(line) ||
  /examlake\.com|^\+?\d[\d\s]{8,}$|Copyrights reserved|^Page \d+$/i.test(line) ||
  /^(Top \d+ IT Certifications|Complete Directory)/i.test(line);

/** Best-effort provider from the certification name. */
const providerFor = (name: string): string | null => {
  const map: Array<[RegExp, string]> = [
    [/\bAWS\b|Amazon Web Services/i, 'Amazon Web Services'],
    [/\bAzure\b|Microsoft/i, 'Microsoft'],
    [/Google Cloud|\bGCP\b|Google/i, 'Google Cloud'],
    [/Oracle|MySQL/i, 'Oracle'],
    [/\bIBM\b/i, 'IBM'],
    [/Salesforce/i, 'Salesforce'],
    [/VMware/i, 'VMware'],
    [/Cisco|CCNA|CCNP|CCIE/i, 'Cisco'],
    [/CompTIA|Security\+|Network\+|A\+/i, 'CompTIA'],
    [/Red Hat|RHCE|RHCSA/i, 'Red Hat'],
    [/Kubernetes|CKA|CKAD|CNCF/i, 'CNCF'],
    [/\bPMP\b|PMI/i, 'PMI'],
    [/\bISC2?\b|CISSP|CCSP/i, 'ISC2'],
    [/Scrum|CSM|SAFe/i, 'Scrum Alliance'],
    [/Databricks/i, 'Databricks'],
    [/Snowflake/i, 'Snowflake'],
    [/HashiCorp|Terraform|Vault/i, 'HashiCorp'],
  ];
  for (const [re, provider] of map) if (re.test(name)) return provider;
  return null;
};

async function main() {
  console.log('🌱 Parsing certification.pdf…');
  const text = await extractPdfText(fs.readFileSync(PDF));
  const lines = text.split('\n').map((l) => l.trim());

  const records: string[] = [];
  let current: string | null = null;

  for (const line of lines) {
    if (isNoise(line)) continue;
    const start = line.match(/^(\d{1,3})\.\s+(.*)$/);
    if (start) {
      if (current) records.push(current);
      current = start[2].trim();
    } else if (current && /^[A-Za-z(]/.test(line) && line.length < 80) {
      // Wrapped continuation of the previous entry.
      current = `${current} ${line}`.replace(/\s+/g, ' ').trim();
    }
  }
  if (current) records.push(current);

  /* Later pages append "Registration Link: <url>" to the name, and some
     entries carry a trailing lowercase slug ("… (CKAD) ckad"). Split the URL
     into its own field and strip the slug so names stay clean. */
  const parsed = records
    .map((raw) => {
      let name = raw.replace(/\s+/g, ' ').trim();
      let link: string | null = null;

      const linkMatch = name.match(/Registration Link:\s*(https?:\/\/\S+)/i);
      if (linkMatch) {
        link = linkMatch[1].replace(/[).,]+$/, '');
        name = name.slice(0, linkMatch.index).trim();
      }

      // Drop trailing slug tokens and any provider heading that ran on.
      name = name.replace(/\s+[a-z0-9-]{2,12}$/,'').trim();
      name = name.replace(/\s*(Linux Foundation & CNCF|Registration Link:?)\s*$/i, '').trim();
      return { name, link };
    })
    .filter((r) => r.name.length > 6);

  const seen = new Set<string>();
  const names = parsed.filter((r) => {
    const key = r.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`   parsed ${names.length} certifications`);

  // Clear previously-imported rows that nothing references, so a re-run
  // replaces a bad parse instead of layering on top of it.
  const referenced = new Set<string>([
    ...(await prisma.courseCertification.findMany({ select: { certificationId: true } })).map((r) => r.certificationId),
    ...(await prisma.certificationInquiry.findMany({ select: { certificationId: true } })).map((r) => r.certificationId ?? ''),
  ]);
  const removable = await prisma.certification.findMany({ select: { id: true } });
  const toDelete = removable.filter((c) => !referenced.has(c.id)).map((c) => c.id);
  if (toDelete.length) {
    await prisma.certification.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`   cleared ${toDelete.length} unreferenced rows before import`);
  }

  let created = 0;
  for (const [i, { name, link }] of names.entries()) {
    const existing = await prisma.certification.findFirst({ where: { name } });
    if (existing) continue;
    await prisma.certification.create({
      data: {
        name,
        provider: providerFor(name),
        link,
        prerequisite: 'None',
        isActive: true,
        ctaEnabled: true,
        sortOrder: i,
      },
    });
    created += 1;
  }

  const total = await prisma.certification.count();
  console.log(`✅ created ${created} new; ${total} certifications total`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
