<template>
  <section class="dynamic-form-container">
    <van-form
      :errorMessageAlign="defaultAlign"
      :showError="false"
      scrollToError
      v-bind="$attrs"
      @submit="handleSubmit"
      @validate="handleValidate"
    >
      <template v-for="(item, itemIdx) of schemaLocal">
        <template v-if="!item.isHideItem">
          <template
            v-if="
              ['select', 'date-picker'].includes(item.van) ||
              (['checkbox', 'radio'].includes(item.van) && item.usePopup)
            "
          >
            <van-field
              :key="item.prop + itemIdx"
              :value="getFieldValue(item)"
              readonly
              clickable
              isLink
              v-bind="getBindAttrs(item)"
              @click="e => handleClickField(e, item)"
            >
              <template v-for="(slot, slotIdx) of item.slots" :slot="slot.name">
                <component
                  :is="slot.template"
                  v-if="slot.template instanceof Object"
                  :key="slot.name + slotIdx"
                  v-bind="slot"
                />
                <div v-else :key="slot.name + slotIdx" v-html="slot.template"></div>
              </template>
            </van-field>
            <van-popup
              :key="`${item.prop}popup`"
              :value="showPickerList.includes(item.showPopupKey)"
              :class="`custom-${item.van}-popup`"
              position="bottom"
              :closeable="['checkbox', 'radio'].includes(item.van)"
              closeIcon="close"
              safeAreaInsetBottom
              v-bind="item.popupProps || {}"
              @click-overlay="changePopupShow(item.showPopupKey)"
              @click-close-icon="changePopupShow(item.showPopupKey)"
            >
              <van-datetime-picker
                v-if="item.van === 'date-picker'"
                :type="item.type || 'date'"
                :value="new Date(getFieldValue(item) || new Date())"
                :title="`请选择${item.label}`"
                :min-date="new Date(dayjs().subtract(80, 'year').format())"
                v-bind="item"
                @confirm="date => handleChangeDate(item, date)"
                @cancel="changePopupShow(item.showPopupKey)"
              />
              <van-picker
                v-else-if="item.van === 'select'"
                :columns="item.options"
                valueKey="label"
                showToolbar
                @confirm="val => setSelectData(item, val)"
                @cancel="changePopupShow(item.showPopupKey)"
              />

              <div v-else-if="['checkbox', 'radio'].includes(item.van) && item.usePopup" class="group-container">
                <component
                  :is="`van-${item.van}-group`"
                  :key="item.prop + itemIdx"
                  :class="`custom-${item.van}-group`"
                  :value="getCheckboxVal(item)"
                  v-bind="getBindAttrs(item)"
                  @input="val => handleChangeGroupVal(item, val)"
                >
                  <component
                    :is="`van-${item.van}`"
                    v-for="option of item.options"
                    :key="option.value"
                    :name="option.value"
                    v-bind="item.optionProps || defaultOptionProps"
                    >{{ option.label }}</component
                  >
                </component>
              </div>
            </van-popup>
          </template>

          <template v-else-if="['checkbox', 'radio'].includes(item.van)">
            <component
              :is="`van-${item.van}-group`"
              :key="item.prop + itemIdx"
              :value="getCheckboxVal(item)"
              v-bind="getBindAttrs(item)"
              @input="val => handleChangeGroupVal(item, val)"
            >
              <component
                :is="`van-${item.van}`"
                v-for="option of item.options"
                :key="option.value"
                :name="option.value"
                v-bind="item.optionProps || defaultOptionProps"
                >{{ option.label }}</component
              >
            </component>
          </template>

          <component
            :is="item.component"
            v-else-if="item.component"
            :key="item.prop + itemIdx"
            :value="formDataLocal[item.prop]"
            v-bind="getBindAttrs(item)"
            @input="val => handleChangeValue(item.prop, val)"
          />

          <component
            :is="`van-${item.van}`"
            v-else
            :key="item.prop + itemIdx"
            :value="formDataLocal[item.prop]"
            v-bind="getBindAttrs(item)"
            @input="val => handleChangeValue(item.prop, val)"
          >
            <template v-for="(slot, slotIdx) of item.slots" :slot="slot.name">
              <component
                :is="slot.template"
                v-if="slot.template instanceof Object"
                :key="slot.name + slotIdx"
                v-bind="slot"
              />
              <div v-else :key="slot.name + slotIdx" v-html="slot.template"></div>
            </template>
          </component>
        </template>
      </template>
    </van-form>
  </section>
</template>

<script setup name="DynamicForm">
import dayjs from 'dayjs'
import { ref, computed, watch, getCurrentInstance, useAttrs } from 'vue'

const $attrs = useAttrs()
const instance = getCurrentInstance().proxy

const defaultOptionProps = {
  checkedColor: '#f691bd',
  shape: 'square',
  iconSize: '14'
}

const props = defineProps({
  schema: {
    type: Array,
    default: () => []
  },
  value: {
    type: Object,
    default: () => {}
  },
  valid: Boolean
})

const emits = defineEmits(['input', 'update:valid', 'setNewKeyVal'])

const showPickerList = ref([])

const schemaLocal = ref([])

watch(
  () => props.schema,
  val => {
    if (val.length) {
      val.forEach((i, idx) => {
        if (['select', 'date-picker', 'checkbox', 'radio'].includes(i.van)) {
          i.showPopupKey = `${i.van}-${idx}`
        }
      })
      schemaLocal.value = val
    }
  },
  { immediate: true }
)

const formDataLocal = computed({
  get() {
    return props.value
  },
  set(val) {
    emits('input', val)
  }
})

const changePopupShow = (key, isShow, { disabled = false } = {}) => {
  if (disabled) return
  if (isShow) {
    showPickerList.value.push(key)
  } else {
    const idx = showPickerList.value.findIndex(i => i === key)
    if (idx > -1) showPickerList.value.splice(idx, 1)
  }
}

const defaultAlign = 'right'
const getBindAttrs = item => {
  const { van, prop, label, required, rules, disabled: itemDisabled } = item
  const { disabled } = $attrs

  return {
    ...item,
    name: prop,
    label,
    inputAlign: defaultAlign,
    placeholder: disabled ? '-' : `请${van === 'field' ? '输入' : '选择'}${label}`,
    required,
    rules: [{ required, message: `请填写${label}`, trigger: 'onBlur' }, ...(rules ? rules : [])],
    disabled: !disabled ? itemDisabled : disabled
  }
}

const getCheckboxVal = ({ prop, checkValStringToArr }) => {
  if (checkValStringToArr) {
    return formDataLocal.value[prop]?.split(',') || []
  }
  return formDataLocal.value[prop]
}

const getFieldValue = ({ van, prop, options }) => {
  if (van === 'select') {
    return getLabelOfOptions(formDataLocal.value[prop], options)
  }
  if (van === 'checkbox') {
    const val = getCheckboxVal({ prop, checkValStringToArr: true })
    return val.map(i => getLabelOfOptions(i, options)).join(',')
  }
  return formDataLocal.value[prop]
}

const getLabelOfOptions = (val, options) => {
  if (val && options?.length) {
    const label = options.find(({ value }) => value === val)?.label || val
    return label
  }
  return ''
}

const setSelectData = ({ prop, showPopupKey }, { value }) => {
  handleChangeValue(prop, value)
  changePopupShow(showPopupKey)
}

const handleChangeValue = (prop, value) => {
  // console.log('has property ', formDataLocal.value.hasOwnProperty(prop))
  if (formDataLocal.value.hasOwnProperty(prop)) {
    formDataLocal.value[prop] = value
  } else {
    instance.$set(formDataLocal.value, prop, value)
  }
}

const handleSubmit = () => {
  emits('update:valid', true)
}

const handleValidate = name => {
  console.log('validate ####', name)
}

const handleChangeDate = ({ prop, type, showPopupKey, format = 'YYYY-MM-DD' }, date) => {
  let formatDate = null
  if (type === 'time') {
    formatDate = date
  } else {
    formatDate = dayjs(date).format(format)
  }
  handleChangeValue(prop, formatDate)
  changePopupShow(showPopupKey)
}

const handleChangeGroupVal = ({ prop, van, checkValStringToArr, exclusive }, val) => {
  if (van === 'checkbox') {
    let valCopy = val.concat().filter(Boolean)
    if (exclusive) {
      if (valCopy.includes(exclusive)) {
        const exclusiveIdx = val.findIndex(i => i === exclusive)
        if (valCopy.length > 1 && exclusiveIdx === 0) {
          valCopy.shift()
        } else if (exclusiveIdx > 0) {
          valCopy = [exclusive]
        }
      } else if (!valCopy.length) {
        valCopy = [exclusive]
      }
    }
    handleChangeValue(prop, checkValStringToArr ? valCopy.join(',') : valCopy)
  } else {
    handleChangeValue(prop, val)
  }
}

const handleClickField = ({ target }, item) => {
  if (target.className.includes('van-field__control--right')) {
    changePopupShow(item.showPopupKey, true, item)
  }
}
</script>

<style scoped lang="less">
/deep/ .van-checkbox {
  padding: 0.83rem;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  &[aria-checked='true'] .van-checkbox__label {
    color: #f691bd;
  }

  &.van-checkbox--disabled {
    &[aria-checked='true'] .van-checkbox__label {
      color: #c8c9cc;
    }
  }
}
.custom-checkbox-popup {
  height: 32.5vh;
  overflow: hidden;
  .group-container {
    height: 100%;
    padding: 1rem;
    overflow-y: auto;
    .custom-checkbox-group {
      display: flex;
      flex-wrap: wrap;
      .van-checkbox {
        flex: 0 0 auto;
        width: 50%;
        margin: 1rem 0;
        border: none;
        transform: scale(0.9);
      }
    }
  }
}

.van-cell__value.van-field__value + div {
  margin-left: 0.5rem;
}

// /deep/ .van-field__error-message {
//   white-space: nowrap;
// }
</style>
