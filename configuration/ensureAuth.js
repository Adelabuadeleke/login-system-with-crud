module.exports = {
    ensureAuth: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('errorMsg', 'You need to be logged in to acces this link');
        res.redirect('/');
    }
}