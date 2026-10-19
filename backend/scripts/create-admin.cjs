// Local one-time admin provisioning. Never commit passwords or DATABASE_URL.
require('dotenv').config();
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/client');
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  const rl = readline.createInterface({ input: stdin, output: stdout });
  let email, password, companyId, firstName, lastName;
  try {
    email = (await rl.question('Admin email: ')).trim().toLowerCase();
    firstName = (await rl.question('First name: ')).trim();
    lastName = (await rl.question('Last name: ')).trim();
    companyId = Number(await rl.question('Existing company ID: '));
    password = await rl.question('Temporary password (input visible; run privately): ');
  } finally { rl.close(); }
  if (!email.includes('@') || !firstName || !lastName || !Number.isSafeInteger(companyId) || companyId < 1 || password.length < 12) throw new Error('Invalid details; password must be at least 12 characters');
  const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try {
    const company = await prisma.company.findUnique({where:{id:companyId}});
    if (!company) throw new Error('Company does not exist. Create company first.');
    const existing = await prisma.user.findUnique({where:{email}});
    if (existing) throw new Error('User already exists. No roles or passwords changed.');
    await prisma.user.create({data:{email,firstName,lastName,companyId,role:'ADMIN',password:await bcrypt.hash(password,12)}});
    console.log('Admin created for company: '+company.name);
  } finally {await prisma.$disconnect();}
}
main().catch(err=>{console.error(err.message);process.exitCode=1;});
