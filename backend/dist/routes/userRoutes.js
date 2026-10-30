"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// All routes require authentication and Super Admin privileges
router.use(auth_1.authenticate);
router.use(auth_1.requireSuperAdmin);
router.get('/', userController_1.getAllUsers);
router.post('/', userController_1.createUser);
router.patch('/:id/role', userController_1.updateUserRole);
router.patch('/:id/status', userController_1.toggleUserStatus);
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
