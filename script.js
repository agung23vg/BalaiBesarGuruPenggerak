import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://eiqkjwjbpbhjieijtjad.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWtqd2picGJoamllaWp0amFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzQzMjAsImV4cCI6MjA2MjgxMDMyMH0.-MPUvR5OePkNkq2NCoNY5ecFNNaLJLm7K4mMFnoKBWI'
const supabase = createClient(supabaseUrl, supabaseKey)

// Register user
const registerForm = document.getElementById('register-form')
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const nama = document.getElementById('nama').value
    const kelas = document.getElementById('kelas').value
    const no_hp = document.getElementById('no_hp').value
    const nama_sekolah = document.getElementById('nama_sekolah').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    // Register ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert('Registrasi gagal: ' + error.message)
      return
    }

    alert('Registrasi berhasil! Silakan cek email untuk verifikasi sebelum login.')
    window.location.href = 'login.html'
  })
}

// Login user & insert ke profiles jika belum ada
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('Login gagal: ' + error.message)
      return
    }

    // Cek dan insert ke profiles jika belum ada
    const user = data.user
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        window.location.href = 'lengkapi-profil.html'
        return
      }
    }

    window.location.href = 'index.html'
  })
}