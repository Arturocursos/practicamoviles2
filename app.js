// 1. Configuración Supabase
const supabaseUrl = 'https://klquqxgqjirudalekaaf.supabase.co'; // Reemplaza
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscXVxeGdxamlydWRhbGVrYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDAyMjIsImV4cCI6MjA1ODUxNjIyMn0.f4ao_rY-nk-vVC5Up0uaql3WKJjGYlxHc3IcweP-PYQ'; // Reemplaza
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Elementos del DOM
const loginSection = document.getElementById('loginSection');
const userSection = document.getElementById('userSection');
const errorMsg = document.getElementById('errorMsg');

// 3. Función de Login
async function login() {
  // Limpiar errores
  errorMsg.textContent = '';
  
  // Obtener valores
  const identificacion = document.getElementById('identificacion').value;
  const clave = document.getElementById('clave').value;

  try {
    // 3.1. Buscar usuario
    const { data: usuario, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('Identificacion', identificacion)
      .single();

    if (error || !usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 3.2. Verificar contraseña (simplificado)
    if (usuario.Clave_Encriptada !== clave) {
      throw new Error('Contraseña incorrecta');
    }

    // 3.3. Iniciar sesión con Supabase Auth
    if (usuario.email) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: clave
      });
      if (authError) throw authError;
    }

    // 3.4. Mostrar información
    showUserInfo(usuario);

  } catch (err) {
    errorMsg.textContent = err.message;
    console.error('Error en login:', err);
  }
}

// 4. Mostrar información del usuario
function showUserInfo(usuario) {
  // Actualizar UI
  document.getElementById('nombreUsuario').textContent = usuario.Nombre_Usuario;
  document.getElementById('userId').textContent = usuario.Identificacion;
  
  // Determinar rol
  let rol = 'Usuario Normal';
  if (usuario.Usuario_Superadministrador == 1) {
    rol = 'Superadministrador';
  } else if (usuario.Usuario_Administrador == 1) {
    rol = 'Administrador';
  }
  document.getElementById('userRole').textContent = rol;
  
  // Cambiar vistas
  loginSection.classList.add('hidden');
  userSection.classList.remove('hidden');
}

// 5. Función de Logout
async function logout() {
  await supabase.auth.signOut();
  loginSection.classList.remove('hidden');
  userSection.classList.add('hidden');
}

// 6. Verificar sesión al cargar
async function checkSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Buscar usuario en nuestra tabla
    const { data: usuario } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('email', user.email)
      .single();
      
    if (usuario) showUserInfo(usuario);
  }
}

// Ejecutar al cargar
checkSession();