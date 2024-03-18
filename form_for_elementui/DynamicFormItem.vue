<template>
  <component
    :is="useGrid ? 'el-col' : 'div'"
    v-if="item.el || item.component"
    :class="'form-item ' + (inline ? 'dynamic-form-item-inline' : 'dynamic-form-item-block')"
    v-bind="item"
  >
    <!-- 标题 -->
    <h3 v-if="item.type === 'title'" class="title">
      {{ item.content }}
    </h3>

    <!-- 子标题 -->
    <h4 v-else-if="item.type === 'sub-title'" class="sub-title">
      {{ item.content }}
    </h4>

    <!-- 分割线 -->
    <el-divider v-else-if="item.type === 'divider'" v-bind="item">
      {{ item.content || '' }}
    </el-divider>

    <!-- 表单项 -->
    <el-form-item
      v-if="!item.isHideItem"
      :label="item.label"
      :prop="item.prop"
      :rules="item.rules"
      v-bind="item"
      class="form-item"
      :style="{ width: '100%', ...(useGrid && { display: 'flex' }), ...item.style }"
    >
      <!-- element组件 -->
      <component
        :is="'el-' + item.el"
        v-if="['select', 'checkbox-group'].includes(item.el)"
        :value="value"
        v-bind="item"
        @input="itemUpdate(item.prop, $event)"
      >
        <component
          :is="'el-' + item.optionEl"
          v-for="(option, optionIndex) of item.options"
          :key="option.value + optionIndex"
          v-bind="option"
        />
      </component>
      <div v-else-if="item.el === 'radio-group'">
        <el-radio-group :value="value" v-bind="item" @input="itemUpdate(item.prop, $event)">
          <template v-if="item.optionEl === 'radio'">
            <el-radio
              v-for="(option, optionIndex) in item.options"
              :key="option.value + optionIndex"
              :label="option.value"
              v-bind="option"
            >
              {{ option.label }}
            </el-radio>
          </template>
          <template v-else-if="item.optionEl === 'radio-button'">
            <el-radio-button v-for="(option, optionIndex) in item.options" :key="optionIndex" v-bind="option">
              {{ option.value }}
            </el-radio-button>
          </template>
        </el-radio-group>

        <div style="margin-left: 20px; padding-bottom: 2px; color: #999">
          {{ item.description }}
        </div>
      </div>
      <component
        :is="'el-' + item.el"
        v-else-if="item.el"
        :value="value"
        v-bind="item"
        @input="itemUpdate(item.prop, $event)"
      >
        <!-- <template v-for="slot of item.slots" #slot.name v-html="slot.template" /> -->
        <div v-for="slot of item.slots" :slot="slot.name" v-html="slot.template" />
      </component>

      <!-- 自定义组件 -->
      <component
        :is="item.component"
        v-else-if="item.component"
        :value="value"
        v-bind="item"
        @input="itemUpdate(item.prop, $event)"
      />
      <!-- 后置内容 -->
      <span v-if="item.append" class="form-item-append">{{ item.append }}</span>

      <!-- 提示 -->
      <p v-if="item.tips" class="form-item-tip">
        {{ item.tips }}
      </p>

      <template v-if="item.itemLabelSlot" #label>
        <div v-html="item.itemLabelSlot"></div>
      </template>
    </el-form-item>
  </component>
</template>

<script>
export default {
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      // default: () => ({})
      default: ''
    },
    item: {
      type: Object,
      default: () => ({})
    },
    inline: {
      type: Boolean
    },
    useGrid: Boolean
  },
  methods: {
    itemUpdate(itemName, itemValue) {
      this.$emit('itemUpdate', itemName, this.item.trimValue ? itemValue.replace(/\s*/g, '') : itemValue)
    }
  }
}
</script>

<style scoped lang="less">
/deep/ .el-form-item {
  margin-bottom: 16px;
}
/deep/ .el-form-item__label-wrap {
  display: flex;
}
/deep/ .el-input__suffix-inner {
  color: #777;
}
// .form-item {
//   display: inline-block;
// }

// dynamic-form-item
.dynamic-form-item-inline {
  display: inline-block;
}
.dynamic-form-item-block {
  display: block;
}

.form-item-tip {
  margin: 0;
  padding: 0;
  line-height: 1.4;
  font-size: 12px;
}
.form-item-append {
  color: #606266;
}
/deep/ .form-item .el-form-item__content {
  flex-grow: 1;
  display: flex;
}

/deep/ .el-date-editor.el-input {
  width: auto;
  .el-input__inner {
    padding-right: 14px;
  }
}

.el-form-item__content {
  width: auto;
}
</style>
