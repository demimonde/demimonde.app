const temp = require('./temp');
const { graphGet } = require('@demimonde/graph');

       const list = async (ctx) => {
  const { token } = ctx.session
  const pages = await graphGet('/me/accounts', token)
  // mutate with accounts and apps
  await Promise.all(pages.map(async (page) => {
    const { access_token, id } = page
    const d = await graphGet(id, access_token, {
      fields: 'subscribed_apps,instagram_accounts,page_backed_instagram_accounts,instagram_business_account',
    }, 1)
    const {
      subscribed_apps: { data: subscribed_apps } = { data: [] },
      instagram_accounts: { data: instagram_accounts } = { data: [] },
      page_backed_instagram_accounts: { data: page_backed_instagram_accounts = [] } = { data: [] },
      instagram_business_account: { id: instagram_business } = {} } = d
    const accs = [...instagram_accounts, ...page_backed_instagram_accounts]
    await Promise.all(accs.map(async (acc) => {
      const { id: accId } = acc
      const dd = await graphGet(accId, access_token, {
        fields: 'id,profile_pic,username',
      }, 1)
      if (dd.error) {
        throw new Error(dd.error.message)
      }
      Object.assign(acc, dd)
    }))
    Object.assign(page, {
      subscribed_apps,
      instagram_accounts,
      page_backed_instagram_accounts,
      instagram_business,
    })
    return page
  }))
  const html = pages.map(({
    instagram_accounts, page_backed_instagram_accounts,
    access_token, name, id, subscribed_apps, instagram_business,
  }) => {
    return `<div><h2><a href="https://facebook.com/${id}">${name}</a></h2>
    ${instagram_business ? `
    <a href="/media?id=${instagram_business}">Media</a>` : ''}
    ${instagram_accounts.length ? '<h3>Instagram Linked Accounts</h3>' : ''}
    ${instagram_accounts.map(({ profile_pic, username, id }) => {
    return `<img src="${profile_pic}" width="50">${username}`
  })}
    ${page_backed_instagram_accounts.length ? '<h3>Page Backed Accounts</h3>' : ''}
      ${page_backed_instagram_accounts.map(({ profile_pic, username, id }) => {
    return `<img src="${profile_pic}" width="50">${username}`
  })}
      ${subscribed_apps.length ? '<h3>Subscribed Apps</h3>' : ''}
      ${subscribed_apps.map((apps) => {
    const { id, name, subscribed_fields, category } = apps
    return `${category}: <a href="https://developers.facebook.com/apps/${id}">${name}</a> (${subscribed_fields.join(', ')})`
  })}
      <a class="subscribe" data-token="${access_token}" data-page="${id}" href="#">Subscribe</a>
    </div>`
  }).join(' ')
  ctx.body = temp({
    user: ctx.session.user,
    data: `<h1>Pages</h1>${html}`,
    script() {
      document.querySelectorAll('.subscribe').forEach(el => {
        el.onclick = async () => {
          const t = el.getAttribute('data-token')
          const p = el.getAttribute('data-page')
          const res = await fetch(`/subscribe?page=${p}&token=${t}`, {
            method: 'POST',
          })
          const j = await res.json()
          console.log(j)
          return false
        }
      })
    },
  })
}

export const media = async (ctx) => {
  const { token } = ctx.session
  const { id } = ctx.query

  const med = await graphGet(`${id}/media`, token, {
    fields: 'caption,media_url,media_type,like_count,permalink',
  })
  // mutate with accounts and apps
  // <h1>Media for <a href="https://facebook.com/${id}">${id}</a></h1>
  const html = med.map(({
    caption = '', media_url, media_type, like_count, permalink,
  }) => {
    return `<div style="display:block;">
  <a href="${permalink}"><img src="${media_url}" width="250"></a><br>
  ${caption}
    </div>`
  }).join(' ')
  ctx.body = temp({
    user: ctx.session.user,
    data: html,
    title: 'Media',
  })
}


module.exports.list = list