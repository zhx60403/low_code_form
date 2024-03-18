<template>
  <section
    :class="{
      'dynamic-form': true,
      'is-group': isGroup,
      'is-multiple': isMultiple
    }"
  >
    <!-- header -->
    <slot name="header" />

    <!-- form body -->
    <template v-if="Array.isArray(formData)">
      <!-- <transition-group appear name="form-box" tag="div"> -->
      <el-form
        v-for="(_, idx) of formData"
        :key="'form' + idx"
        :ref="ref + idx"
        :model="formData[idx]"
        :rules="rules"
        class="form-box"
        v-bind="$attrs"
        v-on="$listeners"
        @validate="handleFormValidate"
      >
        <template v-if="schemaData[idx] || schemaData[schemaData.length - 1]">
          <template v-if="isGroup">
            <component
              :is="useGrid ? 'el-row' : 'div'"
              v-for="(schemas, groupIndex) of schemaData[0]"
              :key="groupIndex"
              :ref="'formGroup' + groupIndex"
              class="form-group"
              v-bind="$attrs"
            >
              <template v-for="(item, index) of schemas">
                <!-- 标题 -->
                <div v-if="isMultiple && item.type === 'title'" :key="index" class="title">
                  <el-link
                    v-if="showAction && formData.length > 1"
                    class="lnk"
                    icon="el-icon-minus"
                    @click="removeForm(idx)"
                  >
                    删除
                  </el-link>
                  <h3>{{ item.content }}{{ !!item.autoIndex ? idx + 1 : '' }}</h3>
                </div>

                <DynamicFormItem
                  v-else
                  :key="item.prop"
                  v-bind="$attrs"
                  :item="item"
                  :value="formData[idx][item.prop]"
                  :useGrid="useGrid"
                  @itemUpdate="itemUpdate(arguments, idx)"
                />
              </template>
            </component>
          </template>
          <DynamicFormItem
            v-for="(item, index) of schemaData[idx] || schemaData[schemaData.length - 1]"
            v-else
            :key="index"
            v-bind="$attrs"
            :item="item"
            :value="formData[idx][item.prop]"
            @itemUpdate="itemUpdate(arguments, idx)"
          />
        </template>
      </el-form>
      <!-- </transition-group> -->

      <!-- buttons -->
      <div v-if="isMultiple && showAction" class="action-box">
        <el-button icon="el-icon-plus" type="default" @click="addForm"> 添加一组 </el-button>
      </div>
      <div
        v-if="showFormSubmitBtns"
        :style="center ? { textAlign: 'center' } : { marginLeft: isGroup ? 'auto' : $attrs['label-width'] || 0 }"
        class="btn-box"
      >
        <slot name="buttons" v-bind="{ formData, loading }">
          <el-button :loading="loading" type="primary" @click="submit"> 保存 </el-button>
          <el-button type="default" @click="reset"> 重置 </el-button>
        </slot>
      </div>
    </template>

    <!-- footer -->
    <slot name="footer" />
  </section>
</template>

<script>
import { Message } from 'element-ui'

import DynamicFormItem from './DynamicFormItem'

let timer = null
let isValidating = false

let validErrMsgInstance = null
const validatePromise = (form, isShowValidErrMsg) => {
  return new Promise((resolve, reject) => {
    if (form.validate) {
      form.validate((valid, fields) => {
        if (valid) {
          return resolve(valid)
        }
        if (isShowValidErrMsg && !validErrMsgInstance) {
          validErrMsgInstance = Message.error(Object.values(fields)[0][0].message)
        }
        reject(false)
      })
    } else {
      reject(false)
    }
  })
}

export default {
  components: {
    DynamicFormItem
  },

  inheritAttrs: false,

  props: {
    schema: {
      type: [Array, Object],
      default: () => []
    },
    value: {
      type: [Array, Object],
      default: () => ({})
    },
    rules: {
      type: Object,
      default: () => ({})
    },
    valid: Boolean,
    loading: Boolean,
    title: {
      type: String,
      default: ''
    },
    showAction: {
      type: Boolean,
      default: true
    },
    center: Boolean,
    showFormSubmitBtns: Boolean,
    useGrid: Boolean,
    scrollToValidateFail: Boolean,
    scrollToValidateFailOfSubmit: {
      type: Boolean,
      default: true
    },
    scrollSmooth: Boolean,
    isShowValidErrMsg: Boolean,
    scrollToValidateFailModel: {
      type: String,
      default: 'last',
      validator: val => ['first', 'last'].includes(val)
    }
  },
  data() {
    return {
      formData: null,
      schemaData: [],
      ref: 'dynamicForm',
      isGroup: false,
      isRowGroup: false,
      groupDividers: ['title', 'rowStart'],
      submitting: false
    }
  },

  computed: {
    isMultiple() {
      return Array.isArray(this.value)
    }
  },

  watch: {
    value: {
      handler(val) {
        this.formData = val ? (Array.isArray(val) ? val : [val]) : [{}]
      },
      deep: true,
      immediate: true
    },
    schema: {
      handler(val) {
        const tmp = (Array.isArray(val[0]) ? val : [val]).filter(Boolean)
        const schemas = tmp.map(t => t.filter(Boolean))
        this.isGroup = schemas.some(s => s.find(i => this.isGroupDividers(i)))
        const ret = []
        if (this.isGroup) {
          for (const schema of schemas) {
            const children = []
            let innerIndex = 0
            for (const [index, item] of schema.filter(Boolean).entries()) {
              if (schema[index - 1] && !this.isGroupDividers(schema[index - 1]) && this.isGroupDividers(item)) {
                innerIndex++
              }
              if (index === 0 || !children[innerIndex]) {
                children[innerIndex] = []
              }
              children[innerIndex].push(item)
            }
            ret.push(children)
          }
          this.schemaData = ret
        } else {
          this.schemaData = schemas
        }
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
    isGroupDividers(item) {
      return item && this.groupDividers.includes(item.type)
    },

    itemUpdate([itemName, itemValue], idx) {
      if (Array.isArray(this.formData)) {
        this.$set(this.formData[idx], itemName, itemValue)
      } else {
        this.$set(this.formData, itemName, itemValue)
      }
      this.$emit('input', this.isMultiple ? this.formData : this.formData[0])
    },

    validate() {
      return Promise.all(
        this.formData.map((form, idx) => validatePromise(this.$refs[this.ref + idx][0], this.isShowValidErrMsg))
      ).finally(() => {
        if (this.isShowValidErrMsg && validErrMsgInstance) validErrMsgInstance = null
      })
    },

    submit() {
      this.submitting = true
      return this.validate()
        .then(() => {
          this.$emit('update:valid', true)
          this.$emit('submit', true, this.isMultiple ? this.formData : this.formData[0])
        })
        .catch(() => {
          this.$emit('update:valid', false)
        })
        .finally(() => {
          setTimeout(() => {
            this.submitting = false
          }, 100)
        })
    },

    reset() {
      this.formData.map((form, idx) => this.$refs[this.ref + idx][0].resetFields())
      this.$emit('reset')
    },

    addForm() {
      this.formData.push({
        ...(Array.isArray(this.value) ? this.value[this.value.length - 1] : this.value)
      })
      this.$emit('add-form', this.formData.length)
    },

    removeForm(idx) {
      this.formData.splice(idx, 1)
      this.$emit('remove-form', idx)
    },

    validateFailFunc(prop) {
      const { scrollToValidateFail, scrollSmooth, scrollToValidateFailOfSubmit, submitting } = this
      if (scrollToValidateFail) {
        if ((scrollToValidateFailOfSubmit && submitting) || !scrollToValidateFailOfSubmit) {
          const formItemDom = document.querySelector(`[prop='${prop}']`)
          if (formItemDom) formItemDom.scrollIntoView({ behavior: scrollSmooth ? 'smooth' : 'instant' })
        }
      }
      this.$emit('update:valid', false)
    },

    handleFormValidate(prop, valid) {
      const { scrollToValidateFailModel: model } = this
      if (!valid) {
        if (model === 'first') {
          if (isValidating) return

          isValidating = true
          this.validateFailFunc(prop)
          setTimeout(() => {
            isValidating = false
          }, 1000)
        } else if (model === 'last') {
          if (timer) clearTimeout(timer)

          timer = setTimeout(() => {
            this.validateFailFunc(prop)
          }, 100)
        }
      }
    }
  }
}
</script>

<style scoped lang="less">
.form-box {
  transition: all 1s;
  // margin-bottom: 20px;

  /deep/ .title {
    margin: 0;
    padding: 10px 0 20px;

    h3 {
      margin: 0;
      padding: 0;
    }

    .lnk {
      float: right;
      line-height: 28px;
    }
  }

  /deep/ .sub-title {
    margin: 0;
    padding: 5px 0 15px;
  }

  &.form-box-enter-active {
    transition: all 0.8s;
  }

  &.form-box-leave-active {
    width: 100%;
    transition: all 0.5s;
  }
  &.form-box-enter {
    opacity: 0;
    transform: translateY(-30px);
  }
  &.form-box-leave-to {
    opacity: 0;
    transform: translateX(190px);
  }
}

.btn-box,
.action-box {
  padding: 10px 10px 10px 0;
}

.btn-box {
  margin-top: 10px;
}

/deep/ .el-form {
  .el-form-item__label {
    float: left;
    &::before {
      content: '';
      display: inline-block;
      margin-right: 4px;
      float: none !important;
    }
  }

  .el-form-item__content {
  }
}
</style>
