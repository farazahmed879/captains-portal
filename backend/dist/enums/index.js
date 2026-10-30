"use strict";
/**
 * Application Enums
 * Centralized, type-safe definitions for all domain models and business logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = exports.SponsorTier = exports.PaymentStatus = exports.ExpenseCategory = exports.TournamentStatus = exports.MatchResult = exports.MatchType = exports.BowlingStyle = exports.BattingStyle = exports.PlayerRole = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN"] = "admin";
    UserRole["CAPTAIN"] = "captain";
    UserRole["TREASURER"] = "treasurer";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var PlayerRole;
(function (PlayerRole) {
    PlayerRole["BATSMAN"] = "batsman";
    PlayerRole["BOWLER"] = "bowler";
    PlayerRole["ALL_ROUNDER"] = "all_rounder";
    PlayerRole["WICKET_KEEPER"] = "wicket_keeper";
})(PlayerRole || (exports.PlayerRole = PlayerRole = {}));
var BattingStyle;
(function (BattingStyle) {
    BattingStyle["RIGHT_HAND"] = "right_hand";
    BattingStyle["LEFT_HAND"] = "left_hand";
})(BattingStyle || (exports.BattingStyle = BattingStyle = {}));
var BowlingStyle;
(function (BowlingStyle) {
    BowlingStyle["RIGHT_ARM_FAST"] = "right_arm_fast";
    BowlingStyle["RIGHT_ARM_MEDIUM"] = "right_arm_medium";
    BowlingStyle["RIGHT_ARM_SPIN"] = "right_arm_spin";
    BowlingStyle["LEFT_ARM_FAST"] = "left_arm_fast";
    BowlingStyle["LEFT_ARM_SPIN"] = "left_arm_spin";
    BowlingStyle["NONE"] = "none";
})(BowlingStyle || (exports.BowlingStyle = BowlingStyle = {}));
var MatchType;
(function (MatchType) {
    MatchType["FRIENDLY"] = "friendly";
    MatchType["TOURNAMENT"] = "tournament";
})(MatchType || (exports.MatchType = MatchType = {}));
var MatchResult;
(function (MatchResult) {
    MatchResult["WON"] = "won";
    MatchResult["LOST"] = "lost";
    MatchResult["TIED"] = "tied";
    MatchResult["DRAW"] = "draw";
    MatchResult["ABANDONED"] = "abandoned";
    MatchResult["PENDING"] = "pending";
})(MatchResult || (exports.MatchResult = MatchResult = {}));
var TournamentStatus;
(function (TournamentStatus) {
    TournamentStatus["UPCOMING"] = "upcoming";
    TournamentStatus["ONGOING"] = "ongoing";
    TournamentStatus["COMPLETED"] = "completed";
    TournamentStatus["CANCELLED"] = "cancelled";
})(TournamentStatus || (exports.TournamentStatus = TournamentStatus = {}));
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["GROUND_FEE"] = "ground_fee";
    ExpenseCategory["BALLS"] = "balls";
    ExpenseCategory["REFRESHMENTS"] = "refreshments";
    ExpenseCategory["UMPIRE_FEE"] = "umpire_fee";
    ExpenseCategory["KITS"] = "kits";
    ExpenseCategory["TRAVEL"] = "travel";
    ExpenseCategory["EQUIPMENT"] = "equipment";
    ExpenseCategory["OTHER"] = "other";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["WAIVED"] = "waived";
    PaymentStatus["PARTIAL"] = "partial";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var SponsorTier;
(function (SponsorTier) {
    SponsorTier["TITLE"] = "title";
    SponsorTier["CO_SPONSOR"] = "co_sponsor";
    SponsorTier["KIT"] = "kit";
    SponsorTier["ASSOCIATE"] = "associate";
})(SponsorTier || (exports.SponsorTier = SponsorTier = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["INFLOW"] = "inflow";
    TransactionType["OUTFLOW"] = "outflow";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
