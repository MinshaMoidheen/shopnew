import mock from '../mock'

export const searchArr = [
  {
    groupTitle: 'Pages',
    searchLimit: 4,
    data: [
      {
        id: 1,
        target: 'dashboard',
        isBookmarked: false,
        title: 'Dashboard',
        icon: 'Home',
        link: '/apps/dashboard'
      },
      // {
      //   id: 2,
      //   target: 'items',
      //   isBookmarked: true,
      //   title: 'Items',
      //   icon: 'Box',
      //   link: '/apps/items'
      // },
      // {
      //   id: 3,
      //   target: 'suppliers',
      //   isBookmarked: true,
      //   title: 'Suppliers',
      //   icon: 'User',
      //   link: '/apps/suppliers'
      // },
      // {
      //   id: 4,
      //   target: 'categories',
      //   isBookmarked: true,
      //   title: 'Categories',
      //   icon: 'Layout',
      //   link: '/apps/categories'
      // },
      // {
      //   id: 5,
      //   target: 'stocks',
      //   isBookmarked: true,
      //   title: 'Stocks',
      //   icon: 'Package',
      //   link: '/apps/stocks'
      // },
      // {
      //   id: 6,
      //   target: 'stockdetails',
      //   isBookmarked: false,
      //   title: 'Stock Details',
      //   icon: 'Package',
      //   link: '/apps/stocks-details'
      // },
      // {
      //   id: 7,
      //   target: 'selling',
      //   isBookmarked: true,
      //   title: 'Selling',
      //   icon: 'ShoppingCart',
      //   link: '/apps/selling'
      // },
      // {
      //   id: 8,
      //   target: 'sellingdetails',
      //   isBookmarked: false,
      //   title: 'Selling Details',
      //   icon: 'ShoppingCart',
      //   link: '/apps/selling-details'
      // },
      // {
      //   id: 9,
      //   target: 'creditAccount',
      //   isBookmarked: true,
      //   title: 'Credit Account',
      //   icon: 'UserCheck',
      //   link: '/apps/accounts'
      // },
    ]
  },
]

// GET Search Data
mock.onGet('/api/main-search/data').reply(() => {
  return [200, { searchArr }]
})

// GET Search Data & Bookmarks
mock.onGet('/api/bookmarks/data').reply(() => {
  const bookmarks = searchArr[0].data.filter(item => item.isBookmarked)
  const suggestions = searchArr[0].data
  return [200, { suggestions, bookmarks }]
})

// POST Update isBookmarked
mock.onPost('/api/bookmarks/update').reply(config => {
  const { id } = JSON.parse(config.data)

  const obj = searchArr[0].data.find(item => item.id === id)

  Object.assign(obj, { isBookmarked: !obj.isBookmarked })

  return [200]
})
