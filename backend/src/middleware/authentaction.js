import RevokedTokenModel from '../models/revokedtoken.model.js';
import UserModel from '../models/user.model.js';
import { verifyToken } from '../utlis/token/token.js';

export const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const [prefix, token] = authorization.split(' ') || [];

    if (!token || !prefix) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    let signature = '';

    if (prefix === process.env.BERFIX_USER) {
      signature = process.env.SIGNATURE_USER;
    } else {
      signature = process.env.SIGNATURE_ADMIN;
    }

    const decoded = verifyToken({ token, signature });

    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized ' });
    }

    const revokedToken = await RevokedTokenModel.findOne({
      tokenId: decoded.jti,
    });

    if (revokedToken) {
      return res.status(401).json({
        message: 'Token revoked, please login again',
      });
    }

    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.decoded = decoded;
    req.user = user;

    next();
  } catch (error) {
    console.error('AUTH ERROR:', error);

    if (
      error.message === 'jwt expired' ||
      error.message === 'invalid signature' ||
      error.name === 'JsonWebTokenError'
    ) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    return res.status(500).json({ message: 'Server error', error: error });
  }
};
