const authService = require('../services/auth.service');
const auditLogger = require('../utils/auditLogger');

const getCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { user, token } = await authService.signup(req.body);

    res.cookie('jwt', token, getCookieOptions());

    await auditLogger.logAction(user._id, 'USER_SIGNUP', req);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error during signup' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { user, token } = await authService.login(req.body);

    res.cookie('jwt', token, getCookieOptions());

    await auditLogger.logAction(user._id, 'USER_LOGIN', req);

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error during login' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await authService.getUserById(req.params.id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Server error' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json({ user });
  } catch (err) {
    console.error('❌ getMe error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ updateProfile error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error during profile update' });
  }
};

// DELETE /api/auth/me
exports.deleteAccount = async (req, res) => {
  try {
    await authService.deleteAccount(req.user.id);

    // Write to audit log (note: userId is tracked even if the User document is gone)
    await auditLogger.logAction(req.user.id, 'USER_LOGOUT', req, {
      metadata: { reason: "GDPR Account Deletion" }
    });

    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error('❌ deleteAccount error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
  }
};
