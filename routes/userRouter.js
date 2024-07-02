const express = require('express');
const { udpateNickname, uploadUserImg, getPossibleParticipants } = require('../controllers/userController');
const {accessTokenAuth} = require('../middlewares/authentication');

const router = express.Router();

router.use(accessTokenAuth);

router.get('/', getPossibleParticipants);
router.post('/update-nickname', udpateNickname);
router.post('/upload-profile-img', uploadUserImg);

module.exports = router;