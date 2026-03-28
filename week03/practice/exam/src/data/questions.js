export const questions = [
  {
    id: 1,
    question: 'HTML5 中 canvas 元素的用途是什么？',
    options: [
      { id: 'a', text: '绘制图形', image: '🎨' },
      { id: 'b', text: '播放音频', image: '🔊' },
      { id: 'c', text: '用于存储数据', image: '💾' },
      { id: 'd', text: '显示视频', image: '🎬' }
    ],
    correct: 'a'
  },
  {
    id: 2,
    question: 'CSS 中，box-sizing 属性的作用是什么？',
    options: [
      { id: 'a', text: '设置边框大小', image: '📦' },
      { id: 'b', text: '设置盒模型的计算方式', image: '📐' },
      { id: 'c', text: '控制元素的高度和宽度', image: '📏' },
      { id: 'd', text: '控制元素的背景色', image: '🎨' }
    ],
    correct: 'b'
  },
  {
    id: 3,
    question: '在 JavaScript 中，let 和 var 的主要区别是什么？',
    options: [
      { id: 'a', text: 'let 具有块级作用域，var 具有函数级作用域', image: '🔒' },
      { id: 'b', text: 'let 是 ES6 的新特性，var 是 ES5 的旧特性', image: '📚' },
      { id: 'c', text: 'let 可以重新声明，var 不能重新声明', image: '🔄' },
      { id: 'd', text: 'let 只能用于常量，var 可以用于变量', image: '⚙️' }
    ],
    correct: 'a'
  },
  {
    id: 4,
    question: '在 JavaScript 中，如何获取数组的长度？',
    options: [
      { id: 'a', text: 'array.getLength()', image: '📊' },
      { id: 'b', text: 'array.size()', image: '📈' },
      { id: 'c', text: 'array.length', image: '✅' },
      { id: 'd', text: 'array.length()', image: '❌' }
    ],
    correct: 'c'
  },
  {
    id: 5,
    question: 'Vue.js 中，哪个生命周期钩子在组件创建后首次被调用？',
    options: [
      { id: 'a', text: 'created', image: '🆕' },
      { id: 'b', text: 'mounted', image: '🔗' },
      { id: 'c', text: 'beforeCreate', image: '⏳' },
      { id: 'd', text: 'updated', image: '🔄' }
    ],
    correct: 'a'
  }
]
