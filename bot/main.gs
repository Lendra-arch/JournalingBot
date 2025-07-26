// === Konfigurasi Awal ===
const TOKEN = "YOUR_BOT_TOKEN";
const TELEGRAM_URL = "https://api.telegram.org/bot" + TOKEN;
const SPREADSHEET_ID = "SPREADSHEET_ID";
const FOLDER_ID = "FOLDER_ID";
// USER ID YANG DIIZINKAN
const ALLOWED_CHAT_ID = 6218908;

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const msg = data.message;
  const callback = data.callback_query;
  const props = PropertiesService.getUserProperties();
  const state = props.getProperty("state");
  const now = new Date().getTime();
  const lastTime = parseInt(props.getProperty("last_interaction") || 0);
  const chatId = msg ? msg.chat.id : callback.message.chat.id;

  if (chatId !== ALLOWED_CHAT_ID) {
    sendMessage(chatId, "🚫 Kamu tidak punya izin untuk menggunakan bot ini.");
    return;
  }

  if (state && now - lastTime > 90 * 1000) {
    props.deleteAllProperties();
    sendMessage(chatId, "⏳ Waktu habis. Mulai ulang dengan /add");
    return;
  }

  if (callback) {
    const cbdata = callback.data;
    const fromId = callback.from.id;
    if (fromId !== ALLOWED_CHAT_ID) return;

    if (cbdata === "start_add") {
      props.setProperty("state", "awaiting_date_choice");
      props.setProperty("last_interaction", now.toString());
      sendInlineKeyboard(fromId, "📅 Pilih tanggal setoran:", [
        [{ text: "Hari Ini", callback_data: "today" }],
        [{ text: "📆 Pilih Manual", callback_data: "manual_date" }]
      ]);
    } else if (cbdata === "bantuan") {
      sendHelp(fromId);
    } else if (cbdata === "today") {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = ("0" + (today.getMonth() + 1)).slice(-2);
      const dd = ("0" + today.getDate()).slice(-2);
      const formatted = yyyy + "-" + mm + "-" + dd;
      props.setProperty("chosen_date", formatted);
      props.setProperty("state", "awaiting_photo");
      props.setProperty("last_interaction", now.toString());
      sendInlineKeyboard(fromId, "📸 Kirim foto atau file bukti setoran kamu:", [
        [{ text: "🚫 Tidak ada foto", callback_data: "no_photo" }]
      ]);
    } else if (cbdata === "manual_date") {
      props.setProperty("state", "awaiting_date_manual");
      props.setProperty("last_interaction", now.toString());
      sendMessage(fromId, "📝 Masukkan tanggal manual (format: YYYY-MM-DD)");
    } else if (cbdata === "no_photo") {
      props.setProperty("uploaded_file_formula", "-");
      props.setProperty("state", "awaiting_description");
      props.setProperty("last_interaction", now.toString());
      sendMessage(fromId, "📝 Tidak ada foto. Sekarang ketik deskripsi kegiatan kamu:");
    } else if (cbdata === "place_gitech") {
      props.setProperty("place", "Gitech Timur");
      simpanLaporan(callback.from.id);
    } else if (cbdata === "place_manual") {
      props.setProperty("state", "awaiting_place_manual");
      props.setProperty("last_interaction", now.toString());
      sendMessage(fromId, "📝 Masukkan lokasi kegiatan:");
    } else if (cbdata === "cek_laporan") {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
      const filtered = data.slice(-5);
      if (!filtered.length) {
        sendMessage(fromId, "⚠️ Tidak ada laporan ditemukan.");
        return;
      }
      let message = "*📋 5 Laporan Terakhir:*\n\n";
      filtered.forEach(row => {
        const tanggal = row[1] instanceof Date ? formatDate(row[1]) : row[1];
        const deskripsi = row[2] || "-";
        const tempat = row[3] || "-";
        const link = row[5] || "";
        message += `📌 ${tanggal}\n📝 ${deskripsi}\n📍 ${tempat}`;
        if (link && link.startsWith("http")) message += `\n🔗 [Gambar](${link})`;
        message += "\n\n";
      });
      sendMessage(fromId, message);
    }
    return;
  }

  if (msg && msg.text) {
    const text = msg.text.trim();

    if (text === "/start") {
      const today = new Date();
      const time = today.toTimeString().split(" ")[0];
      const date = today.toISOString().split("T")[0];
      const name = msg.from.first_name || "pengguna";
      const teks = `👋 Hi ${name}! \nWhat do you want to do right now?\n\n🕒 ${time} | 📅 ${date}`;
      sendInlineKeyboard(chatId, teks, [
        [{ text: "➕ Tambah Laporan", callback_data: "start_add" }],
        [{ text: "📋 Cek Laporan", callback_data: "cek_laporan" }],
        [{ text: "❓ Help", callback_data: "bantuan" }]
      ]);
      return;
    }

    if (text === "/help") {
      sendHelp(chatId);
      return;
    }

    if (text === "/add") {
      props.setProperty("state", "awaiting_date_choice");
      props.setProperty("last_interaction", now.toString());
      sendInlineKeyboard(chatId, "📅 Pilih tanggal setoran:", [
        [{ text: "Hari Ini", callback_data: "today" }],
        [{ text: "📆 Pilih Manual", callback_data: "manual_date" }]
      ]);
      return;
    }

    if (text === "/cancel") {
      props.deleteAllProperties();
      sendMessage(chatId, "❌ Proses dibatalkan. Mulai ulang dengan /add");
      return;
    }

    if (text.startsWith("/cek")) {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
      const keyword = text.replace("/cek", "").trim().toLowerCase();

      const filtered = keyword
        ? data.filter(row => {
            const tanggal = row[1] instanceof Date ? formatDate(row[1]) : row[1];
            const deskripsi = row[2] ? row[2].toLowerCase() : "";
            return tanggal.includes(keyword) || deskripsi.includes(keyword);
          })
        : data.slice(-5);

      if (!filtered.length) {
        sendMessage(chatId, "⚠️ Tidak ada laporan ditemukan.");
        return;
      }

      let message = "*📋 Hasil Laporan:*\n\n";
      filtered.forEach(row => {
        const tanggal = row[1] instanceof Date ? formatDate(row[1]) : row[1];
        const deskripsi = row[2] || "-";
        const tempat = row[3] || "-";
        const link = row[5] || "";
        message += `📌 ${tanggal}\n📝 ${deskripsi}\n📍 ${tempat}`;
        if (link && link.startsWith("http")) message += `\n🔗 [Gambar](${link})`;
        message += "\n\n";
      });

      sendMessage(chatId, message);
      return;
    }

    if (state === "awaiting_date_manual") {
      const tanggal = text;
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(tanggal)) {
        sendMessage(chatId, "⚠️ Format salah. Contoh: 2025-07-01");
        return;
      }
      props.setProperty("chosen_date", tanggal);
      props.setProperty("state", "awaiting_photo");
      props.setProperty("last_interaction", now.toString());
      sendInlineKeyboard(chatId, "📸 Kirim foto atau file bukti setoran kamu:", [
        [{ text: "🚫 Tidak ada foto", callback_data: "no_photo" }]
      ]);
      return;
    }

    if (state === "awaiting_description") {
      props.setProperty("description", text);
      props.setProperty("state", "awaiting_place_choice");
      props.setProperty("last_interaction", now.toString());
      sendInlineKeyboard(chatId, "📍 Di mana kegiatan ini dilakukan?", [
        [{ text: "Gitech Timur", callback_data: "place_gitech" }],
        [{ text: "✍️ Isi Manual", callback_data: "place_manual" }]
      ]);
      return;
    }

    if (state === "awaiting_place_manual") {
      props.setProperty("place", text);
      simpanLaporan(chatId);
      return;
    }
  }

  if (state === "awaiting_photo" && msg) {
    let fileId = null;
    if (msg.photo) {
      fileId = msg.photo[msg.photo.length - 1].file_id;
    } else if (msg.document) {
      fileId = msg.document.file_id;
    }

    if (!fileId) {
      sendMessage(chatId, "⚠️ Kirim foto atau file, atau tekan 'Tidak ada foto'.");
      return;
    }

    sendMessage(chatId, "⏳ Mengunggah file, mohon tunggu...");

    const fileUrl = TELEGRAM_URL + "/getFile?file_id=" + fileId;
    const fileResponse = UrlFetchApp.fetch(fileUrl);
    const filePath = JSON.parse(fileResponse.getContentText()).result.file_path;
    const fileBlob = UrlFetchApp.fetch("https://api.telegram.org/file/bot" + TOKEN + "/" + filePath).getBlob();

    const tanggal = props.getProperty("chosen_date");
    const extension = fileBlob.getContentType().split("/")[1] || "jpg";
    const fileName = tanggal + "_" + new Date().getTime() + "." + extension;
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const uploaded = folder.createFile(fileBlob).setName(fileName);
    Utilities.sleep(2000);
    const uploadedId = uploaded.getId();
    const url = `https://drive.google.com/uc?export=view&id=${uploadedId}`;

    props.setProperty("uploaded_file_formula", `=IMAGE(\"${url}\"; 4; 150; 150)`);
    props.setProperty("state", "awaiting_description");
    props.setProperty("last_interaction", now.toString());
    sendMessage(chatId, "✅ File berhasil diunggah! Sekarang ketik deskripsi kegiatan kamu:");
    return;
  }
}

function simpanLaporan(chatId) {
  const props = PropertiesService.getUserProperties();
  const tanggal = props.getProperty("chosen_date");
  const deskripsi = props.getProperty("description") || "-";
  const formula = props.getProperty("uploaded_file_formula") || "-";
  const place = props.getProperty("place") || "-";

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1).setFormula("=ROW()-1");
  sheet.getRange(lastRow, 2, 1, 3).setValues([[tanggal, deskripsi, place]]);
  sheet.getRange(lastRow, 5).setFormula(formula);
  const urlMatch = formula.match(/\"(https:\/\/.*?)\"/);
  const url = urlMatch ? urlMatch[1] : "";
  sheet.getRange(lastRow, 6).setValue(url);
  sheet.setRowHeight(lastRow, 160);
  sheet.setColumnWidth(5, 160);

  props.deleteAllProperties();
  sendMessage(chatId, "📌 Laporan kamu berhasil dicatat. Terima kasih!");
}

function sendMessage(chatId, text) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown"
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(TELEGRAM_URL + "/sendMessage", options);
}

function sendInlineKeyboard(chatId, text, keyboard) {
  const payload = {
    chat_id: chatId,
    text: text,
    reply_markup: JSON.stringify({ inline_keyboard: keyboard })
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(TELEGRAM_URL + "/sendMessage", options);
}

function sendHelp(chatId) {
  const helpText = 
`📖 *Panduan Bot Setoran*\n
/start ➕ Mulai bot  
/add ➕ Tambah laporan baru  
/cek [keyword/tanggal] 📋 Lihat laporan terakhir atau cari  
/cancel ❌ Batalkan proses  

📌 *Langkah Pengisian Laporan:*  
1. Pilih tanggal setoran  
2. Kirim file atau foto bukti (*boleh skip*)  
3. Tulis deskripsi kegiatan  
4. Pilih lokasi kegiatan (Gitech Timur atau isi manual)  

💡 *Tips:*  
- Gunakan *File*, bukan *Photo*, agar tidak terkompres.  
- Format tanggal: YYYY-MM-DD (contoh: 2025-07-09)`;
  sendMessage(chatId, helpText);
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = ('0' + (date.getMonth() + 1)).slice(-2);
  const dd = ('0' + date.getDate()).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}
