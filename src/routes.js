
let router = require('express').Router();
var multer =require('multer');

router.get('/', function (req, res) {
    res.json({
        status: 'Successfully Rendered',
        message: 'The todo app is Successfully developed and available for all users!',
    });
});

var userController = require('./controllers/users');
var taskController = require('./controllers/tasks');

//User Controller
router.route('/users')
    .get(userController.index)
    .post(userController.new);
router.route('/login')
    .post(userController.login);
router.route('/user_profile')
    .get(userController.profile);
router.route('/users/reset_password')
    .post(userController.reset);
router.route('/users/reset_password/update')
    .post(userController.updateResetPassword);
router.route('/logout')
    .put(userController.logout)
    .patch(userController.logout);

//Task Controller
router.route('/tasks/add')
    .post(taskController.new);
router.route('/tasks')
    .get(taskController.index);
router.route('/tasks/expiry')
    .get(taskController.indexexpiry);
router.route('/user_tasks')
    .get(taskController.usertask);
router.route('/tasks/delete/:task_id')
    .delete(taskController.delete);
router.route('/tasks/:task_id')
    .get(taskController.view)
    .put(taskController.update)
    .patch(taskController.update);

module.exports = router;