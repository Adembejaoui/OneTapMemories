"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
    const hashedPassword = await bcrypt_1.default.hash('22733039adem', 10);
    // Create or update admin user
    const admin = await prisma.user.upsert({
        where: { email: 'adembejaoui59@gmail.com' },
        update: {
            password: hashedPassword,
            name: 'Admin',
        },
        create: {
            email: 'adembejaoui59@gmail.com',
            name: 'Admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('Admin user:', admin);
    // Create a sample event
    const event = await prisma.event.create({
        data: {
            name: 'Summer Wedding 2026',
            slug: 'summer-wedding-2026',
            email: 'wedding@onetapmemories.com',
            maxUploadsPerGuest: 10,
        },
    });
    console.log('Event created:', event);
    // Create an event creation token
    const token = await prisma.eventCreationToken.create({
        data: {
            token: 'demo-token-12345',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });
    console.log('Token created:', token);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
