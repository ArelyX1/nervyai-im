(async ()=>{
  try{
    const res = await fetch('http://localhost:4002/api/accounts/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'TestUser', pin: '12345', state: { user: { nickname: 'TestUser', totalXp: 5 } } })
    })
    const j = await res.json()
    console.log('CREATE RESPONSE:', j)
  } catch(e){ console.error('ERR', e) }
})()
