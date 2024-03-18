<template>
  <DynamicForm
    v-model="formDataLocal"
    :schema="computedFormSchema"
    :valid.sync="formValid"
    isMultilevelProp
    bindMultipleProp
    v-bind="allFormOption"
  />
</template>

<script setup name="RenderFormPage">
import { ref, computed, watch } from 'vue'

import { useRefStore, useMapData } from 'common/hooks'
import {
  getSimpleFormObj,
  getRequireFormRule,
  verifyCardId,
  verifyComonFunc,
  verifyValScopeFunc,
  defaultDynamicFormPropsObj
} from 'common/utils/formCommon'

import mockFormSchema from './mockFormSchema'

import BlockDivider from 'common/components/form/BlockDivider'
import SubTitle from 'common/components/form/SubTitle'
import SelectAndInput from 'common/components/form/SelectAndInput'
import TwoInput from 'common/components/form/TwoInput'
import ManyInput from 'common/components/form/ManyInput'
import SelectAndTwoInput from 'common/components/form/SelectAndTwoInput'
import ReuseSelectionBox from 'common/components/form/ReuseSelectionBox'
import Checkbox from 'common/components/form/Checkbox'
import ImageUpload from 'common/components/form/ImageUpload'
import ButtonInput from 'common/components/form/ButtonInput'
import BodyEvaluation from 'common/components/form/BodyEvaluation'
import RadioSelect from 'common/components/form/RadioSelect'
import AreaHosipital from 'common/components/form/AreaHosipital'
import SelectDoctor from 'common/components/form/SelectDoctor'
import GuidanceImage from 'common/components/form/GuidanceImage'
import DynamicForm from 'common/components/dynamic-components/DynamicForm'

const formComponents = {
  BlockDivider,
  SelectAndInput,
  TwoInput,
  ManyInput,
  SelectAndTwoInput,
  ReuseSelectionBox,
  SubTitle,
  Checkbox,
  ImageUpload,
  ButtonInput,
  BodyEvaluation,
  RadioSelect,
  AreaHosipital,
  SelectDoctor,
  GuidanceImage
}

const props = defineProps({
  formValid: Boolean,
  formData: {
    type: Object,
    required: true
  },
  formModel: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(['update:formValid', 'input'])

const formValid = computed({
  get() {
    return props.formValid
  },
  set(val) {
    emits('update:formValid', val)
  }
})

// const { proxy: instance } = getCurrentInstance()

const formDataLocal = computed({
  get() {
    return props.formData
  },
  set(val) {
    emits('input', val)
  }
})

const mapData = useMapData(props.formModel?.formOption?.form?.mapKeys || [])
const formOption = ref({})
const formSchema = ref([])
const formRef = ref()

// let formSchemaBackup = []

// const schemaPropFuncKey = ['disabledUseFunc']
const schemaFuncScope = { formDataLocal }
const runSchemaPropFunc = arr => {
  arr.forEach(i => {
    if (i.disabledOption) {
      const { useFunc, funcText } = i.disabledOption
      if (useFunc && funcText) {
        i.disabled = new Function(`return ${funcText}`).call(schemaFuncScope)
      }
    }
    if (i.isHideOption) {
      const { useFunc, funcText } = i.isHideOption
      if (useFunc && funcText) {
        i.isHideItem = new Function(`return ${funcText}`).call(schemaFuncScope)
      }
    }
  })
  return arr
}

const computedFormSchema = computed(() => {
  return formSchema.value.filter(i => !i.isHideItem)
})

const toSetFormSchema = arr => {
  formSchema.value = runSchemaPropFunc(arr || formSchema.value)
}

watch(() => formDataLocal.value, () => {
  toSetFormSchema()
}, { deep: true, immediate: true })

const allFormOption = computed(() => {
  return { ...defaultDynamicFormPropsObj, ...formOption.value }
})

watch(() => allFormOption.value.form, val => {
  if (val?.watchList?.length) {
    val.watchList.forEach(i => {
      window.Function(i).call({ watch, formDataLocal })
    })
  }
}, { deep: true })

const formItemNeedExpand = ['FcRow']
const setupFormJson = ({ formOption, formSchema }) => {
  const func = children => {
    const formItemList = []
    const loopFunc = arr => {
      arr.forEach(i => {
        if (i.field) {
          formItemList.push(i)
        } else if (i?.children?.length) {
          loopFunc(i.children)
        }
      })
    }
    loopFunc(children)
    return formItemList
  }

  let formSchemaList = []
  formSchema.forEach(i => {
    if (formItemNeedExpand.includes(i.type)) {
      const arr = func(i.children)
      formSchemaList = [...formSchemaList, ...arr, { type: 'rowStart' }]
    } else {
      formSchemaList.push(i)
    }
  })

  return { formOption, formSchemaList }
}

const elToComponentList = [
  'BlockDivider',
  'SelectAndInput',
  'TwoInput',
  'ManyInput',
  'SelectAndTwoInput',
  'ReuseSelectionBox',
  'SubTitle',
  'Checkbox',
  'ImageUpload',
  'ButtonInput',
  'BodyEvaluation',
  'RadioSelect',
  'AreaHosipital',
  'SelectDoctor',
  'GuidanceImage'
]
const dontChangeSchemaKeysOfVal = ['rowStart']
const formSchemaKeyMap = {
  type: 'el',
  field: 'prop',
  title: 'label'
}

const hasOptionItemType = ['select', 'checkbox', 'radio']
const elComponentToGroup = ['checkbox', 'radio']

const callRuleFuncScope = { formDataLocal, verifyComonFunc, verifyCardId }

const conversionFormSchemaKeys = schema => {
  const arr = []
  schema.forEach(({ title, type, field, $required, valScope, props = {} }) => {
    let formItemObj = {}

    if (dontChangeSchemaKeysOfVal.includes(type)) {
      formItemObj = { type }
    } else {
      let componentType = type

      if (props.hasOwnProperty('field')) field = props.field
      if (elComponentToGroup.includes(type)) {        
        componentType = `${type}-group` 
      }
      
      formItemObj = getSimpleFormObj(title, field, componentType, Boolean($required), props.suffix)
    }
    if (elToComponentList.includes(type)) {
      formItemObj.component = formComponents[type]
      formItemObj.componentName = type
      delete formItemObj.el
    }

    if ((hasOptionItemType.includes(type) || elToComponentList.includes(type)) && props) {
      const { _optionType, mapDataKey } = props
      if (_optionType === 3) {
        if (mapDataKey) {
          formItemObj.options = mapData[mapDataKey]
        }
      }
    }

    if (Array.isArray(props.rules)) {
      const registeredRules = props.rules.map(({ validator, trigger }) => {
        const obj = {}
        if (typeof validator === 'string') {
          obj.validator = new Function(`return ${validator}`).call(callRuleFuncScope)
        }
        obj.trigger = trigger
        return obj
      })
      formItemObj.rules = [...(formItemObj.rules || []), ...registeredRules]
    }

    if (valScope) {
      formItemObj.rules = [...(formItemObj.rules || []), verifyValScopeFunc()]
    }
    formItemObj = { ...props, ...formItemObj }

    arr.push(formItemObj)
  })

  return arr
}

const getFormModel = () => {
    const { formOption: option, formSchemaList } = setupFormJson(props.formModel)
    formOption.value = option
    const schema = conversionFormSchemaKeys(formSchemaList)
    toSetFormSchema(schema)
}

watch(() => mapData, mapDataObj => {
  if (Object.keys(mapDataObj).length) {
    getFormModel()
  }
}, { immediate: true, deep: true })


defineExpose({
  formRef
})
</script>

<style lang="less" scoped>
@import url('common/style/common.less');
.common-form-grid(28rem);

/deep/ .form-item {
  width: 100%;

  &[el='checkbox-group'],
  &[componentname='Checkbox'] {
    width: auto;
    .el-checkbox-group,
    .el-form-item__content > div {
      width: auto !important;
    }
  }

}

</style>
