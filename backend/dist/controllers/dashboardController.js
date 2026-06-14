import { Event } from "../models/Event.js";
import { ROLE, USER_STATUS, User } from "../models/User.js";
export async function getStats(_req, res) {
    const now = new Date();
    const [totalEvents, totalParticipants, upcomingEvents] = await Promise.all([
        Event.countDocuments(),
        User.countDocuments({ roleId: ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE }),
        Event.countDocuments({ eventDate: { $gte: now } }),
    ]);
    return res.json({
        totalEvents,
        totalParticipants,
        upcomingEvents,
    });
}
