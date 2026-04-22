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
            isApproved: true
        };

        if (filterActive) {
            whereClause.OR = [
                { sentMessages: { some: { receiverId: currentUserId } } },
                { receivedMessages: { some: { senderId: currentUserId } } }
            ];
        }

        // 1. Get ALL unread counts in a SINGLE query to avoid N+1 performance issues
        const unreadCounts = await (db as any).userMessage.groupBy({
            by: ['senderId'],
            where: {
                receiverId: currentUserId,
                isRead: false
            },
            _count: {
                id: true
            }
        });

        const unreadMap = new Map();
        unreadCounts.forEach((item: any) => {
            unreadMap.set(item.senderId, item._count.id);
        });

        // 2. Maximum Performance: Select only the required fields instead of including entire rows.
        const users = await db.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                imageUrl: true,
                role: { select: { name: true } },
                referee: { select: { firstName: true, lastName: true, classification: true, imageUrl: true, regions: { select: { name: true } } } },
                official: { select: { firstName: true, lastName: true, officialType: true, imageUrl: true, regions: { select: { name: true } } } }
            }
        });

        const usersWithUnread = users.map((u: any) => {
            const unreadFromUser = unreadMap.get(u.id) || 0;

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
                city: u.referee?.regions?.find((r: any) => !["Avrupa", "Anadolu", "BGM"].includes(r.name))?.name ||
                    u.official?.regions?.find((r: any) => !["Avrupa", "Anadolu", "BGM"].includes(r.name))?.name ||
                    "İstanbul",
                hasUnread: unreadFromUser > 0
            };
        });

        return usersWithUnread.sort((a: any, b: any) => (b.hasUnread ? 1 : 0) - (a.hasUnread ? 1 : 0));
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

    if (!term || term.trim().length < 1) return [];

    try {
        // Maximum Performance: Select only the required fields.
        const users = await db.user.findMany({
            where: {
                id: { not: currentUserId },
                isApproved: true
            },
            select: {
                id: true,
                username: true,
                imageUrl: true,
                role: { select: { name: true } },
                referee: { select: { firstName: true, lastName: true, classification: true, imageUrl: true } },
                official: { select: { firstName: true, lastName: true, officialType: true, imageUrl: true } }
            }
        });

        const rawTerm = term.toLowerCase().trim();
        const normalizedTerm = rawTerm.replace(/\s+/g, '');

        const results = [];

        for (const u of users) {
            let userRole = u.role.name;
            let name = "";

            if (u.referee) {
                userRole = formatClassification(u.referee.classification);
                name = `${u.referee.firstName} ${u.referee.lastName}`;
            } else if (u.official) {
                userRole = formatOfficialType(u.official.officialType);
                name = `${u.official.firstName} ${u.official.lastName}`;
            } else {
                // Admins frequently fall here; fallback to username
                name = u.username;
            }

            const rawName = name.toLowerCase();
            const normalizedName = rawName.replace(/\s+/g, '');

            let score = 0;

            // 1. Exact Name match (Highest Priority)
            if (rawName.includes(rawTerm)) {
                score = 100;
            }
            // 2. Exact match without spaces (e.g. "efecanbayrak" matches "efe can bayrak")
            else if (normalizedName.includes(normalizedTerm)) {
                score = 80;
            }
            // 3. Subsequence fuzzy match (Typo-Tolerance like "Ef Cn Bayak" -> "Efe Can Bayrak")
            else {
                let i = 0;
                let j = 0;
                while (i < normalizedTerm.length && j < normalizedName.length) {
                    if (normalizedTerm[i] === normalizedName[j]) {
                        i++;
                    }
                    j++;
                }

                if (i === normalizedTerm.length) {
                    score = 50;
                }
            }

            if (score > 0) {
                results.push({
                    id: u.id,
                    name,
                    role: userRole,
                    imageUrl: u.referee?.imageUrl || u.official?.imageUrl || u.imageUrl || "/hakem/defaultHakem.png",
                    score
                });
            }
        }

        return results
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.name.localeCompare(b.name, 'tr');
            })
            .slice(0, 15) // Return top 15 matches for speed and UI constraints
            .map(({ score, ...rest }) => rest);

    } catch (error) {
        console.error("SearchUsers Error:", error);
        return [];
    }
}
