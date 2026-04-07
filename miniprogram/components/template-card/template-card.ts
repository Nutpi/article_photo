Component({
  properties: {
    template: Object,
  },

  data: {
    gradientStr: '',
  },

  observers: {
    'template': function (tpl: any) {
      if (!tpl) return;
      const bg = tpl.background;
      if (bg.type === 'gradient' && bg.colors) {
        this.setData({
          gradientStr: `linear-gradient(${bg.direction || 180}deg, ${bg.colors.join(', ')})`
        });
      } else if (bg.type === 'solid') {
        this.setData({
          gradientStr: bg.solidColor || '#000'
        });
      }
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('apply', { id: this.properties.template.id });
    }
  }
});
