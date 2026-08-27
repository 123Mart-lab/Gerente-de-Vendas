async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    if(data.models) {
        console.log(data.models.map(m => m.name).join('\n'));
    } else {
        console.log("No models array", data);
    }
  } catch(e) { console.error(e); }
}
run();
