"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMatch = exports.updateMatch = exports.createMatch = exports.getMatchById = exports.getMatches = void 0;
const Match_1 = require("../models/Match");
const MatchPayment_1 = require("../models/MatchPayment");
const getMatches = async (req, res) => {
    try {
        const { teamId, matchType, tournamentId } = req.query;
        const filter = { tenantId: req.user?.tenantId };
        if (teamId)
            filter.teamId = teamId;
        if (matchType)
            filter.matchType = matchType;
        if (tournamentId)
            filter.tournamentId = tournamentId;
        const matches = await Match_1.Match.find(filter)
            .populate('teamId', 'name shortName primaryColor')
            .populate('tournamentId', 'name format')
            .populate('momPlayerId', 'name role')
            .populate('squadPlayerIds', 'name role phone')
            .sort({ matchDate: -1 });
        // Enrich with collection summary (total fee collected vs total fee assigned)
        const enrichedMatches = await Promise.all(matches.map(async (m) => {
            const payments = await MatchPayment_1.MatchPayment.find({ matchId: m._id });
            const totalCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
            const totalAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
            const paidCount = payments.filter((p) => p.paymentStatus === 'paid').length;
            const pendingCount = payments.filter((p) => p.paymentStatus !== 'paid').length;
            return {
                ...m.toObject(),
                totalCollected,
                totalAssigned,
                pendingFee: totalAssigned - totalCollected,
                paidPlayersCount: paidCount,
                pendingPlayersCount: pendingCount,
            };
        }));
        res.json({ success: true, matches: enrichedMatches });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMatches = getMatches;
const getMatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await Match_1.Match.findOne({ _id: id, tenantId: req.user?.tenantId })
            .populate('teamId')
            .populate('tournamentId')
            .populate('momPlayerId')
            .populate('squadPlayerIds');
        if (!match) {
            res.status(404).json({ success: false, message: 'Match not found' });
            return;
        }
        const payments = await MatchPayment_1.MatchPayment.find({ matchId: match._id })
            .populate('playerId', 'name phone role jerseyNumber')
            .sort({ createdAt: 1 });
        res.json({ success: true, match, payments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMatchById = getMatchById;
const createMatch = async (req, res) => {
    try {
        const { teamId, matchType, tournamentId, tournamentStage, matchDate, opponentTeam, venue, overs, groundCost, umpireCost, ballCost, refreshmentCost, otherCosts, perPlayerFee, squadPlayerIds, result, teamScore, opponentScore, winningPrizeMoney, momPlayerId, momAwardDetails, momPrizeMoney, notes, } = req.body;
        if (!teamId || !opponentTeam || !venue || !matchDate) {
            res.status(400).json({ success: false, message: 'Team, opponent, venue, and date are required' });
            return;
        }
        const ground = Number(groundCost) || 0;
        const umpire = Number(umpireCost) || 0;
        const ball = Number(ballCost) || 0;
        const refresh = Number(refreshmentCost) || 0;
        const other = Number(otherCosts) || 0;
        const totalMatchExpense = ground + umpire + ball + refresh + other;
        // Default per player fee calculation if not explicitly provided
        let calculatedPerPlayerFee = Number(perPlayerFee) || 0;
        const squad = squadPlayerIds || [];
        if (!calculatedPerPlayerFee && squad.length > 0 && totalMatchExpense > 0) {
            calculatedPerPlayerFee = Math.ceil(totalMatchExpense / squad.length);
        }
        const match = await Match_1.Match.create({
            tenantId: req.user?.tenantId,
            teamId,
            matchType: matchType || 'friendly',
            tournamentId: matchType === 'tournament' ? tournamentId : undefined,
            tournamentStage: matchType === 'tournament' ? tournamentStage || 'regular' : undefined,
            matchDate,
            opponentTeam,
            venue,
            overs: Number(overs) || 20,
            groundCost: ground,
            umpireCost: umpire,
            ballCost: ball,
            refreshmentCost: refresh,
            otherCosts: other,
            totalMatchExpense,
            perPlayerFee: calculatedPerPlayerFee,
            squadPlayerIds: squad,
            result: result || 'upcoming',
            teamScore,
            opponentScore,
            winningPrizeMoney: Number(winningPrizeMoney) || 0,
            momPlayerId: momPlayerId || undefined,
            momAwardDetails,
            momPrizeMoney: Number(momPrizeMoney) || 0,
            notes,
        });
        // Automatically create payment records for each squad player
        if (squad.length > 0) {
            const paymentDocs = squad.map((playerId) => ({
                tenantId: req.user?.tenantId,
                teamId,
                matchId: match._id,
                playerId,
                feeAssigned: calculatedPerPlayerFee,
                feePaid: 0,
                paymentStatus: 'pending',
            }));
            await MatchPayment_1.MatchPayment.insertMany(paymentDocs);
        }
        res.status(201).json({ success: true, match });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createMatch = createMatch;
const updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        // Recalculate total expense if costs changed
        const hasAnyCostField = req.body.groundCost !== undefined ||
            req.body.umpireCost !== undefined ||
            req.body.ballCost !== undefined ||
            req.body.refreshmentCost !== undefined ||
            req.body.otherCosts !== undefined;
        if (hasAnyCostField) {
            const ground = Number(req.body.groundCost) || 0;
            const umpire = Number(req.body.umpireCost) || 0;
            const ball = Number(req.body.ballCost) || 0;
            const refresh = Number(req.body.refreshmentCost) || 0;
            const other = Number(req.body.otherCosts) || 0;
            req.body.totalMatchExpense = ground + umpire + ball + refresh + other;
            req.body.groundCost = ground;
            req.body.umpireCost = umpire;
            req.body.ballCost = ball;
            req.body.refreshmentCost = refresh;
            req.body.otherCosts = other;
        }
        else if (req.body.totalMatchExpense !== undefined && req.body.groundCost === undefined) {
            req.body.groundCost = Number(req.body.totalMatchExpense) || 0;
        }
        if (req.body.momPlayerId === '' || req.body.momPlayerId === 'none') {
            req.body.momPlayerId = null;
        }
        if (req.body.momPrizeMoney !== undefined) {
            req.body.momPrizeMoney = Number(req.body.momPrizeMoney) || 0;
        }
        const match = await Match_1.Match.findOneAndUpdate({ _id: id, tenantId: req.user?.tenantId }, req.body, { new: true })
            .populate('teamId')
            .populate('momPlayerId', 'name role jerseyNumber');
        if (!match) {
            res.status(404).json({ success: false, message: 'Match not found' });
            return;
        }
        if (req.body.teamId) {
            await MatchPayment_1.MatchPayment.updateMany({ matchId: id, tenantId: req.user?.tenantId }, { teamId: req.body.teamId });
        }
        res.json({ success: true, match });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateMatch = updateMatch;
const deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await Match_1.Match.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
        if (!match) {
            res.status(404).json({ success: false, message: 'Match not found' });
            return;
        }
        // Clean up payments for this match
        await MatchPayment_1.MatchPayment.deleteMany({ matchId: id });
        res.json({ success: true, message: 'Match and associated payments deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteMatch = deleteMatch;
