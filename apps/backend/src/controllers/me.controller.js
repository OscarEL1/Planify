// HU-17: los datos vienen del payload del JWT verificado por authenticateToken, sin consultar la BD
export function createGetMeController() {
  return function getMe(req, res) {
    const { sub, name, email, role } = req.auth.payload;
    return res.status(200).json({ id: sub, name, email, role });
  };
}
