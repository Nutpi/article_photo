Component({
  methods: {
    onShareTap() {
      // open-type="share" handles this natively
    },

    onWatermarkTap() {
      this.triggerEvent('savewatermark');
    },

    onClose() {
      this.triggerEvent('close');
    },

    preventMove() {}
  }
});
