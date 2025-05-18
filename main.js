const supabaseUrl = 'https://eiqkjwjbpbhjieijtjad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWtqd2picGJoamllaWp0amFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzQzMjAsImV4cCI6MjA2MjgxMDMyMH0.-MPUvR5OePkNkq2NCoNY5ecFNNaLJLm7K4mMFnoKBWI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = "bbgpparung@gmail.com";
const ADMIN_WA_NUMBER = '6288223881917';
let bookings = [];

// Toggle mobile menu
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('active');
}

// Cek login sebelum booking
async function handleBookingClick(fieldType) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (confirm('Anda harus login/daftar dulu untuk booking. Daftar sekarang?')) {
      window.location.href = 'login.html';
    }
    return;
  }
  openBookingModal(fieldType);
}

// Cek role user & tampilkan badge admin
async function checkUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  const adminBadge = document.getElementById('admin-badge');
  if (user) {
    document.getElementById('login-nav').style.display = 'none';
    document.getElementById('logout-nav').style.display = 'block';
    if (user.email === ADMIN_EMAIL) {
      document.body.classList.add('admin');
      if (adminBadge) adminBadge.style.display = 'inline-block';
    } else {
      document.body.classList.remove('admin');
      if (adminBadge) adminBadge.style.display = 'none';
    }
  } else {
    document.getElementById('login-nav').style.display = 'block';
    document.getElementById('logout-nav').style.display = 'none';
    document.body.classList.remove('admin');
    if (adminBadge) adminBadge.style.display = 'none';
  }
}

// Open booking modal
function openBookingModal(fieldType) {
  document.getElementById('modal-title').innerText = `Pesan ${fieldType}`;
  document.getElementById('field-type').value = fieldType;
  document.getElementById('booking-modal').style.display = 'block';
  populateTimeOptions(fieldType);
}

// Close booking modal
function closeBookingModal() {
  document.getElementById('booking-modal').style.display = 'none';
  document.getElementById('booking-form').reset();
}

// Populate time options
function populateTimeOptions(fieldType) {
  const timeSelect = document.getElementById('booking-time');
  timeSelect.innerHTML = '<option value="">Pilih Jam</option>';
  let startHour, endHour;
  if (fieldType === 'Lapangan Voli') {
    startHour = 8; endHour = 22;
  } else if (fieldType === 'Lapangan Mini Soccer') {
    startHour = 8; endHour = 23;
  } else if (fieldType === 'Lapangan Tenis') {
    startHour = 6; endHour = 21;
  } else {
    startHour = 8; endHour = 20;
  }
  for (let hour = startHour; hour <= endHour; hour++) {
    const hourString = hour.toString().padStart(2, '0') + ':00';
    const option = document.createElement('option');
    option.value = hourString;
    option.textContent = hourString;
    timeSelect.appendChild(option);
  }
}

// Calculate end time
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  let newHour = hours + duration;
  if (newHour >= 24) newHour -= 24;
  return `${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Modal Cek Ketersediaan
function openAvailabilityModal() {
  document.getElementById('availability-modal').style.display = 'block';
}
function closeAvailabilityModal() {
  document.getElementById('availability-modal').style.display = 'none';
  document.getElementById('availability-form').reset();
  document.getElementById('availability-result').innerHTML = '';
}

// Cek ketersediaan
async function checkAvailability(event) {
  event.preventDefault();
  const date = document.getElementById('availability-date').value;
  const field = document.getElementById('availability-field').value;
  if (!date || !field) {
    document.getElementById('availability-result').innerHTML = '<p style="color:red;">Tanggal dan lapangan wajib diisi.</p>';
    return;
  }
  let startHour = 8, endHour = 22;
  if (field === 'Lapangan Mini Soccer') endHour = 23;
  if (field === 'Lapangan Tenis') { startHour = 6; endHour = 21; }
  const { data, error } = await supabase
    .from('booking')
    .select('time, duration, nama')
    .eq('date', date)
    .eq('field', field);
  if (error) {
    document.getElementById('availability-result').innerHTML = '<p style="color:red;">Gagal mengambil data.</p>';
    return;
  }
  const bookedMap = {};
  data.forEach(b => {
    const jamMulai = parseInt(b.time.split(':')[0], 10);
    const durasi = parseInt(b.duration, 10);
    for (let i = 0; i < durasi; i++) {
      const jam = jamMulai + i;
      bookedMap[jam] = b.nama;
    }
  });

  let html = '<table style="width:100%;border-collapse:collapse;"><tr><th>Jam</th><th>Status</th></tr>';
  for (let h = startHour; h <= endHour; h++) {
    const jamStr = h.toString().padStart(2, '0') + ':00';
    if (bookedMap[h]) {
      html += `<tr style="background:#fee;"><td>${jamStr}</td><td>Terbooking oleh <b>${bookedMap[h]}</b></td></tr>`;
    } else {
      html += `<tr style="background:#efe;"><td>${jamStr}</td><td><b>Kosong</b></td></tr>`;
    }
  }
  html += '</table>';
  document.getElementById('availability-result').innerHTML = html;
}

// Submit booking form
async function submitBooking(event) {
  event.preventDefault();
  try {
    const field = document.getElementById('field-type').value.trim();
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const duration = parseInt(document.getElementById('booking-duration').value);

    // Ambil user yang login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Anda harus login untuk booking!');
      window.location.href = 'login.html';
      return;
    }

    // Ambil profil user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      alert('Profil tidak ditemukan. Silakan lengkapi profil Anda.');
      window.location.href = 'lengkapi-profil.html';
      return;
    }

    // Validasi form
    if (!field || !date || !time || isNaN(duration)) {
      alert('Semua field harus diisi!');
      return;
    }

    const endTime = calculateEndTime(time, duration);
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Memproses...';
    submitBtn.disabled = true;

    // Insert ke tabel booking
    const { data, error } = await supabase
      .from('booking')
      .insert([{
        user_id: user.id,
        nama: profile.nama,
        kelas: profile.kelas,
        no_hp: profile.no_hp,
        nama_sekolah: profile.nama_sekolah,
        email: user.email,
        field,
        date,
        time,
        duration,
        status: 'Menunggu Konfirmasi'
      }])
      .select();

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (error) {
      console.error('Error Supabase:', error);
      alert('Booking gagal: ' + error.message);
      return;
    }
    if (data && data.length > 0) {
      bookings.push(data[0]);
      displayBookings();
      closeBookingModal();
      alert('Booking berhasil dibuat! Sedang mengarahkan ke WhatsApp...');
      const waMessage = `Halo Admin,%0ASaya ingin booking ${field}%0ANama: ${profile.nama}%0AKelas: ${profile.kelas}%0ASekolah: ${profile.nama_sekolah}%0ANo HP: ${profile.no_hp}%0AEmail: ${user.email}%0ATanggal: ${date}%0AJam: ${time} - ${endTime}%0ADurasi: ${duration} jam.%0ATerima kasih!`;
      window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${waMessage}`, '_blank');
    } else {
      alert('Tidak ada data yang dikembalikan dari server. Mohon coba lagi.');
    }
  } catch (error) {
    console.error('Gagal booking:', error.message);
    alert('Booking gagal. Silakan cek koneksi internet dan pastikan Supabase berfungsi dengan baik.');
  }
}

// Display bookings in table
function displayBookings() {
  const tbody = document.querySelector('#booking-table tbody');
  const thead = document.querySelector('#booking-table thead tr');
  const isAdmin = document.body.classList.contains('admin');
  // Set header kolom
  thead.innerHTML = `
    <th>Lapangan</th>
    <th>Tanggal</th>
    <th>Jam</th>
    <th>Status</th>
    ${isAdmin ? '<th>Aksi</th>' : ''}
  `;
  tbody.innerHTML = '';
  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin ? 5 : 4}" style="text-align: center;">Belum ada jadwal pemesanan</td></tr>`;
    return;
  }
  bookings.forEach(booking => {
    let row = `
      <tr>
        <td>${booking.field}</td>
        <td>${booking.date}</td>
        <td>${booking.time} (${booking.duration} jam)</td>
        <td>${booking.status}</td>
    `;
    if (isAdmin) {
      row += `<td><button class="cancel-btn" onclick="cancelBooking(${booking.id})">Batalkan</button></td>`;
    }
    row += '</tr>';
    tbody.innerHTML += row;
  });
}

// Fetch bookings from database
async function fetchBookings() {
  try {
    const { data, error } = await supabase
      .from('booking')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw error;
    bookings = data || [];
    displayBookings();
  } catch (error) {
    console.error('Gagal mengambil data booking:', error.message);
    const tbody = document.querySelector('#booking-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Gagal memuat data jadwal. Cek koneksi atau refresh halaman.</td></tr>';
  }
}

// Cancel booking (admin only)
async function cancelBooking(id) {
  if (!confirm('Apakah Anda yakin ingin membatalkan pemesanan ini?')) {
    return;
  }
  try {
    const { error } = await supabase
      .from('booking')
      .delete()
      .eq('id', id);
    if (error) throw error;
    bookings = bookings.filter(b => b.id !== id);
    displayBookings();
    alert('Pemesanan berhasil dibatalkan');
  } catch (error) {
    console.error('Gagal membatalkan booking:', error.message);
    alert('Gagal membatalkan pemesanan. Silakan coba lagi nanti.');
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  document.getElementById('logout-nav').style.display = 'none';
  document.getElementById('login-nav').style.display = 'block';
  bookings = [];
  displayBookings();
  alert('Logout berhasil');
}

// On page load
window.onload = async function() {
  await checkUserRole();
  await fetchBookings();
};