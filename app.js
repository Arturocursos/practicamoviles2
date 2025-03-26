// 1. Configuración Supabase
const supabaseUrl = 'https://klquqxgqjirudalekaaf.supabase.co'; // Reemplaza
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscXVxeGdxamlydWRhbGVrYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDAyMjIsImV4cCI6MjA1ODUxNjIyMn0.f4ao_rY-nk-vVC5Up0uaql3WKJjGYlxHc3IcweP-PYQ'; // Reemplaza
const supabase = createClient(supabaseUrl, supabaseKey);
// Elementos del DOM
const registerSection = document.getElementById('registerSection');
const loginSection = document.getElementById('loginSection');
const userPanel = document.getElementById('userPanel');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');
const logoutBtn = document.getElementById('logoutBtn');

// Mostrar/ocultar formularios
showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  registerSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
});

showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginSection.classList.add('hidden');
  registerSection.classList.remove('hidden');
});

// Registro de usuario
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const identificacion = document.getElementById('regIdentificacion').value;
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const tipoUsuario = document.getElementById('regTipoUsuario').value;

  try {
    // 1. Registrar usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    // 2. Insertar en tabla Usuarios
    const usuarioData = {
      Identificacion: identificacion,
      Nombre_Usuario: nombre,
      Clave_Encriptada: password, // En producción usa bcrypt
      email,
      Usuario_Normal: tipoUsuario === 'normal' ? 1 : 0,
      Usuario_Administrador: tipoUsuario === 'admin' ? 1 : 0,
      Usuario_Superadministrador: tipoUsuario === 'superadmin' ? 1 : 0
    };

    const { data: userData, error: dbError } = await supabase
      .from('Usuarios')
      .insert([usuarioData])
      .select();

    if (dbError) throw dbError;

    alert('Registro exitoso! Verifica tu email para confirmar la cuenta.');
    registerForm.reset();
    showLogin.click();

  } catch (error) {
    document.getElementById('registerError').textContent = error.message;
    console.error('Error en registro:', error);
  }
});

// Login de usuario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const identificacion = document.getElementById('loginIdentificacion').value;
  const password = document.getElementById('loginPassword').value;

  try {
    // 1. Buscar usuario por identificación
    const { data: usuario, error: userError } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('Identificacion', identificacion)
      .single();

    if (userError || !usuario) throw new Error('Usuario no encontrado');

    // 2. Iniciar sesión con Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password
    });

    if (authError) throw authError;

    // 3. Mostrar panel de usuario
    showUserInfo(usuario);

  } catch (error) {
    document.getElementById('loginError').textContent = error.message;
    console.error('Error en login:', error);
  }
});

// Mostrar información del usuario
function showUserInfo(usuario) {
  document.getElementById('userName').textContent = usuario.Nombre_Usuario;
  document.getElementById('userId').textContent = usuario.Identificacion;
  document.getElementById('userEmail').textContent = usuario.email;
  
  let rol = 'Usuario Normal';
  if (usuario.Usuario_Superadministrador) rol = 'Superadministrador';
  else if (usuario.Usuario_Administrador) rol = 'Administrador';
  
  document.getElementById('userRole').textContent = rol;
  
  loginSection.classList.add('hidden');
  registerSection.classList.add('hidden');
  userPanel.classList.remove('hidden');
}

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  userPanel.classList.add('hidden');
  loginSection.classList.remove('hidden');
  loginForm.reset();
});

// Verificar sesión al cargar
async function checkSession() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: usuario } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('email', user.email)
      .single();
      
    if (usuario) showUserInfo(usuario);
  }
}

checkSession();