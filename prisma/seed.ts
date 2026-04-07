import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    const superadminPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.upsert({
        where: { email: 'superadmin@example.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'superadmin@example.com',
            password: superadminPassword,
            role: Role.SUPERADMIN,
        },
    })

    const adminPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@example.com',
            password: adminPassword,
            role: Role.ADMIN,
        },
    })

    const userPassword = await bcrypt.hash('user123', 10)
    await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            name: 'Regular User',
            email: 'user@example.com',
            password: userPassword,
            role: Role.USER,
        },
    })

    console.log('Seeding completed.')
    console.log('Test credentials:')
    console.log('  SUPERADMIN: superadmin@example.com / admin123')
    console.log('  ADMIN:      admin@example.com / admin123')
    console.log('  USER:       user@example.com / user123')
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
