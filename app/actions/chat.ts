"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { formatClassification, formatOfficialType } from "@/lib/format-utils";

export async function sendMessage(receiverId: number, content: string) {
    const session = await verifySession();
    const senderId = session.userId;

    if (!content.trim()) return { error: "Mesaj boş olamaz." };

    try {
        const message = await (db as any).userMessage.create({
            data: {
                senderId,
                receiverId,
                content,
            },
        });

        revalidatePath("/admin");
        revalidatePath("/referee");
        return { success: true, message };
    } catch (error) {
        console.error("SendMessage Error:", error);
        return { error: "Mesaj gönderilemedi." };
    }
}

export async function getMessages(otherUserId: number) {
    const session = await verifySession();
    const userId = session.userId;

    try {
        const messages = await (db as any).userMessage.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        // Mark as read
        await (db as any).userMessage.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return messages;
    } catch (error) {
        console.error("GetMessages Error:", error);
        return [];
    }
}

export async function getChatUsers(filterActive = false) {
    const session = await verifySession();
    const currentUserId = session.userId;

    try {
        const whereClause: any = {
            id: { not: currentUserId },
            isApproved: true,
            role: {
                name: { in: ["REFEREE", "GENERAL_OFFICIAL", "ADMIN", "SUPER_ADMIN", "ADMIN_IHK"] }
            }
        };

        if (filterActive) {
            whereClause.OR = [
                { sentMessages: { some: { receiverId: currentUserId } } },
                { receivedMessages: { some: { senderId: currentUserId } } }
            ];
        }

        const users = await db.user.findMany({
            where: whereClause,
            include: {
                referee: {
                    include: { regions: { select: { name: true } } }
                },
                official: {
                    include: { regions: { select: { name: true } } }
                },
                role: true
            },
        });

        const usersWithUnread = await Promise.all(users.map(async (u) => {
            const unreadFromUser = await (db as any).userMessage.count({
                where: {
                    senderId: u.id,
                    receiverId: currentUserId,
                    isRead: false
                }
            });

            let userRole = u.role.name;
            if (u.referee) {
                userRole = formatClassification(u.referee.classification);
            } else if (u.official) {
                userRole = formatOfficialType(u.official.officialType);
            } else {
                userRole = formatOfficialType(u.role.name);
            }

            return {
                id: u.id,
                name: u.referee
                    ? `${u.referee.firstName} ${u.referee.lastName}`
                    : u.official
                        ? `${u.official.firstName} ${u.official.lastName}`
                        : u.username,
                role: userRole,
                imageUrl: u.referee?.imageUrl || u.official?.imageUrl || u.imageUrl || "/hakem/defaultHakem.png",
                city: u.referee?.regions?.find(r => !["Avrupa", "Anadolu", "BGM"].includes(r.name))?.name ||
                    u.official?.regions?.find(r => !["Avrupa", "Anadolu", "BGM"].includes(r.name))?.name ||
                    "İstanbul",
                hasUnread: unreadFromUser > 0
            };
        }));

        return usersWithUnread.sort((a, b) => (b.hasUnread ? 1 : 0) - (a.hasUnread ? 1 : 0));
    } catch (error) {
        console.error("GetChatUsers Error:", error);
        return [];
    }
}

export async function deleteConversation(otherUserId: number) {
    const session = await verifySession();
    const userId = session.userId;

    try {
        await (db as any).userMessage.deleteMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
        });
        revalidatePath("/admin");
        revalidatePath("/referee");
        return { success: true };
    } catch (error) {
        console.error("DeleteConversation Error:", error);
        return { error: "Sohbet silinemedi." };
    }
}

export async function getUnreadCount() {
    const session = await verifySession();
    if (!session) return 0;

    try {
        const count = await (db as any).userMessage.count({
            where: {
                receiverId: session.userId,
                isRead: false,
            },
        });
        return count;
    } catch (error) {
        return 0;
    }
}

export async function searchUsers(term: string) {
    const session = await verifySession();
    const currentUserId = session.userId;

    if (!term || term.length < 1) return [];

    try {
        const users = await db.user.findMany({
            where: {
                id: { not: currentUserId },
                isApproved: true,
                role: {
                    name: { in: ["REFEREE", "GENERAL_OFFICIAL", "ADMIN", "SUPER_ADMIN", "ADMIN_IHK"] }
                },
                OR: [
                    { username: { contains: term, mode: 'insensitive' } },
                    { referee: { OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }] } },
                    { official: { OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }] } },
                ]
            },
            include: {
                referee: true,
                official: true,
                role: true
            },
            take: 10
        });

        return users.map(u => {
            let userRole = u.role.name;
            if (u.referee) {
                userRole = formatClassification(u.referee.classification);
            } else if (u.official) {
                userRole = formatOfficialType(u.official.officialType);
            }

            return {
                id: u.id,
                name: u.referee
                    ? `${u.referee.firstName} ${u.referee.lastName}`
                    : u.official
                        ? `${u.official.firstName} ${u.official.lastName}`
                        : u.username,
                role: userRole,
                imageUrl: u.referee?.imageUrl || u.official?.imageUrl || u.imageUrl || "/hakem/defaultHakem.png",
            };
        }).sort((a, b) => {
            const lowerTerm = term.toLowerCase();
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            const aStarts = aName.startsWith(lowerTerm);
            const bStarts = bName.startsWith(lowerTerm);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return aName.localeCompare(bName, 'tr');
        });
    } catch (error) {
        console.error("SearchUsers Error:", error);
        return [];
    }
}
