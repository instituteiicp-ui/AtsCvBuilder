// netlify/functions/generate-resume.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const resumeHTML = buildResumeHTML(data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${(data.fullName || 'resume').replace(/\s+/g, '_')}_ATS_Resume.doc"`,
        'Access-Control-Allow-Origin': '*'
      },
      body: resumeHTML
    };
  } catch (error) {
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

function buildResumeHTML(data) {
  const fontMap = {
    calibri: "Calibri, 'Segoe UI', Arial, sans-serif",
    arial: "Arial, sans-serif",
    times: "'Times New Roman', serif"
  };
  const font = fontMap[data.fontStyle] || fontMap.calibri;
  const header = data.headerStyle || 'classic';

  // Helper to escape HTML
  const esc = (str) => String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  let contactParts = [];
  if (data.email) contactParts.push('📧 ' + esc(data.email));
  if (data.phone) contactParts.push('📱 ' + esc(data.phone));
  if (data.linkedin) contactParts.push('🔗 ' + esc(data.linkedin));
  if (data.github) contactParts.push('💻 ' + esc(data.github));
  let contactLine = contactParts.join(' | ');

  let addressLine = '';
  if (data.permAddress) {
    addressLine = '🏠 ' + esc(data.permAddress);
    if (data.tempAddress && data.tempAddress !== data.permAddress) {
      addressLine += ' | 📍 Current: ' + esc(data.tempAddress);
    }
  }

  const fullName = esc(data.fullName || 'YOUR NAME');
  const objective = esc(data.objective || 'A motivated fresher seeking an entry-level position.');

  let html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Resume</title></head>
<body style="font-family:${font}; font-size:11pt; line-height:1.5; color:#000; margin:0; padding:0;">
`;

  // Header
  if (header === 'classic') {
    html += `<h1 style="font-size:20pt;text-align:center;margin-bottom:2px;text-transform:uppercase;">${fullName}</h1>`;
    if (contactLine) html += `<p style="text-align:center;font-size:9.5pt;border-bottom:1.5px solid #333;padding-bottom:6px;">${contactLine}</p>`;
    if (addressLine) html += `<p style="text-align:center;font-size:9pt;">${addressLine}</p>`;
  } else if (header === 'left-aligned') {
    html += `<h1 style="font-size:20pt;border-bottom:2px solid #333;padding-bottom:6px;">${fullName}</h1>`;
    if (contactLine) html += `<p style="font-size:9.5pt;">${contactLine}</p>`;
    if (addressLine) html += `<p style="font-size:9pt;">${addressLine}</p>`;
  } else if (header === 'bold-line') {
    html += `<div style="border-top:3px solid #000;padding-top:10px;text-align:center;"><h1 style="font-size:20pt;">${fullName}</h1></div>`;
    if (contactLine) html += `<p style="text-align:center;font-size:9.5pt;">${contactLine}</p>`;
    if (addressLine) html += `<p style="text-align:center;font-size:9pt;">${addressLine}</p>`;
    html += `<div style="border-bottom:3px solid #000;margin-bottom:8px;"></div>`;
  }

  // Career Objective
  html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Career Objective</h2>`;
  html += `<p style="text-align:justify;">${objective}</p>`;

  // Education
  if (data.education && data.education.length > 0) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Educational Qualifications</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:9.5pt;"><tr style="background:#f5f5f5;"><th style="border:1px solid #ccc;padding:4px;">Qualification</th><th style="border:1px solid #ccc;padding:4px;">Institution</th><th style="border:1px solid #ccc;padding:4px;">Board/University</th><th style="border:1px solid #ccc;padding:4px;">Year</th><th style="border:1px solid #ccc;padding:4px;">%/CGPA</th></tr>`;
    data.education.forEach(e => {
      html += `<tr><td style="border:1px solid #ccc;padding:4px;">${esc(e.degree)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(e.institution)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(e.board)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(e.year)}</td><td style="border:1px solid #ccc;padding:4px;">${esc(e.percentage)}</td></tr>`;
    });
    html += `</table>`;
  }

  // Skills
  const techSkills = [...(data.skills?.skillProg||[]), ...(data.skills?.skillFramework||[]), ...(data.skills?.skillTools||[]), ...(data.skills?.skillDB||[])];
  const softSkills = data.skills?.skillSoft || [];
  if (techSkills.length || softSkills.length) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Skills</h2>`;
    if (techSkills.length) html += `<p><strong>Technical:</strong> ${techSkills.map(esc).join(', ')}</p>`;
    if (softSkills.length) html += `<p><strong>Soft Skills:</strong> ${softSkills.map(esc).join(', ')}</p>`;
  }

  // Projects
  if (data.projects && data.projects.length > 0 && data.projects.some(p => p.title)) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Projects</h2>`;
    data.projects.forEach(p => {
      if (!p.title) return;
      html += `<p><strong>${esc(p.title)}</strong> ${p.duration ? '('+esc(p.duration)+')' : ''}</p>`;
      if (p.technologies) html += `<p><em>Technologies:</em> ${esc(p.technologies)}</p>`;
      if (p.description) {
        const bullets = p.description.split('\n').filter(l => l.trim());
        if (bullets.length) {
          html += `<ul>`;
          bullets.forEach(b => html += `<li>${esc(b.replace(/^[•\-]\s*/, ''))}</li>`);
          html += `</ul>`;
        }
      }
    });
  }

  // Experience
  if (data.experience && data.experience.length > 0 && data.experience.some(e => e.company)) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Experience / Internships</h2>`;
    data.experience.forEach(e => {
      if (!e.company) return;
      html += `<p><strong>${esc(e.role)} | ${esc(e.company)}</strong> ${e.duration ? '('+esc(e.duration)+')' : ''}</p>`;
      if (e.description) {
        const bullets = e.description.split('\n').filter(l => l.trim());
        if (bullets.length) {
          html += `<ul>`;
          bullets.forEach(b => html += `<li>${esc(b.replace(/^[•\-]\s*/, ''))}</li>`);
          html += `</ul>`;
        }
      }
    });
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0 && data.certifications.some(c => c.name)) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Certifications</h2><ul>`;
    data.certifications.forEach(c => {
      if (c.name) html += `<li>${esc(c.name)} ${c.issuer ? '- '+esc(c.issuer) : ''} ${c.year ? '('+esc(c.year)+')' : ''}</li>`;
    });
    html += `</ul>`;
  }

  // Languages
  if (data.languages && data.languages.length) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Languages Known</h2><p>${data.languages.map(esc).join(', ')}</p>`;
  }

  // Achievements
  if (data.achievements && data.achievements.length > 0 && data.achievements.some(a => a.text)) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Achievements</h2><ul>`;
    data.achievements.forEach(a => { if(a.text) html += `<li>${esc(a.text)}</li>`; });
    html += `</ul>`;
  }

  // Hobbies
  if (data.hobbies && data.hobbies.length) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Hobbies & Interests</h2><p>${data.hobbies.map(esc).join(', ')}</p>`;
  }

  // Declaration
  if (data.includeDeclaration) {
    html += `<h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #333;margin-top:16px;padding-bottom:3px;">Declaration</h2>`;
    html += `<p style="text-align:justify;">I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.</p>`;
    html += `<p style="margin-top:10px;"><strong>Place:</strong> ${esc(data.declarationPlace || '')}</p>`;
    html += `<p style="text-align:right;"><strong>${fullName}</strong></p>`;
  }

  html += `</body></html>`;
  return html;
}
