<script lang="js" setup>

import * as NP from "number-precision";


const optionTypes = ref([
  {
    text: 'Công văn',
    value: 'tmp00001'
  },
  {
    text: 'Giấy chứng nhận',
    value: 'tmp00002'
  },
  {
    text: 'Giấy giới thiệu',
    value: 'tmp00003'
  },
  {
    text: 'Nghị định',
    value: 'tmp00004'
  },
  {
    text: 'Kế hoạch',
    value: 'tmp00005'
  },
  {
    text: 'Quyết định',
    value: 'tmp00006'
  },
  {
    text: 'Thông tư',
    value: 'tmp00007'
  },
  {
    text: 'Tờ trình',
    value: 'tmp00007'
  },
])


const pdfViewerUrl = ref('')
const selectedType = ref(optionTypes.value[0])
const selectedFile = ref([])
const {init} = useToast()

const successProcess = ref(false)

const onReset = () => {
  successProcess.value = false
  selectedFile.value = []
}

const loadingProcess = ref(false)
const config = useRuntimeConfig()
const processing = async () => {
  successProcess.value = false
  if (selectedFile.value.length === 0) {
    init({
      message: 'Upload a PDF file to process',
      offsetX: 20,
      offsetY: 50,
      color: 'danger'
    })
    return
  }
  try {
    loadingProcess.value = true;
    const file = toRaw(selectedFile).value[0]
    let formData = new FormData();
    formData.append("file", file);
    formData.append('tmp', selectedType.value.value)
    const {data, status} = await useFetch(config.public.backendApi, {
      method: 'POST',
      server: true,
      body: formData
    })
    if (toRaw(status).value === "success") {
      const res = toRaw(data.value)
      processFileResult(res["file"])
      postProcessing(res["data"])
      successProcess.value = true
    } else {
      init({
        message: 'Cannot process this file',
        offsetX: 20,
        offsetY: 50,
        color: 'danger'
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingProcess.value = false;
  }
}

let fileResult = ref()

const processFileResult = (data) => {
  let binaryData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  let blob = new Blob([binaryData], { type: "application/pdf"  });
  const file = new File([blob], "document.pdf", { type: "application/pdf" })
  pdfViewerUrl.value = URL.createObjectURL(file)
}


let result = ref([])

const postProcessing = (data) => {
  try {
    result.value = []
    const documentNumber = getDocumentNumber(data.page_1.header_left)
    result.value.push(documentNumber)
    const promulgateDate = getPromulgateDate(data.page_1.header_right);
    result.value.push(promulgateDate)
    const documentTitle = getDocumentTile(data.page_1.centeralign)
    result.value.push(documentTitle)
    const signInfo = calculateSignUnit(data)
    result.value.push(...signInfo)
    const recipes = getRecipes(data)
    result.value.push(recipes)
  } catch (e) {
    console.error(e)
    init({
      message: 'File is successful process but the data seems not in a good condition',
      offsetX: 20,
      offsetY: 50,
      color: 'warning'
    })
  }
}

const getPromulgateDate = (data) => {
  return analysis(() => {
    let index = 1;
    while (true) {
      const indexData = data[index]
      console.debug(indexData)
      if (indexData == null) {
        break
      }
      const regexPattern = /.*\bngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d+\b.*/gu;
      const matches = indexData.text.match(regexPattern);
      console.debug(indexData.text)


      if (matches) {
        const regexExtractDatetime = /ngày (\d{1,2}) tháng (\d{1,2}) năm (\d{4})/;
        const match = indexData.text.toLowerCase().match(regexExtractDatetime);
        if (match) {
          const day = match[1];
          const month = match[2];
          const year = match[3];

          return {
            text: 'Ngày ban hành',
            data: `${day}/${month}/${year}`,
            accuracy: round(parseFloat(indexData.prob) * 100)
          }
        } else {
          console.log("No match found.");
        }

      }
      index++;
    }
  })
}

const analysis = (callback) => {
  try {
    return callback()
  } catch (e) {
    console.error(e)
    return {}
  }
}

const getDocumentNumber = (data) => {
  return analysis(() => {
    let index = 1;
    while (true) {
      const potentialDN = data[index];
      if (potentialDN == null) {
        break;
      }
      let numberPatternMatchers = ["Số:", "SỐ", "Số", "SỐ:", "số", "số:"]
      for (let pt of numberPatternMatchers) {
        if (matcher(pt, potentialDN.text)) {
          const svb = potentialDN.text.replace(pt, "").trim()
          return {
            text: 'Số văn bản',
            data: svb,
            accuracy: round(parseFloat(potentialDN.prob) * 100)
          }
        }
      }
      index++
    }
    return {}
  })
}

const matcher = (textPattern, textRecognize) => {
  textPattern = textPattern.toLowerCase()
  const regexString = `(?:^|[^\\p{L}])${textPattern}(?:[^\\p{L}]|$)`;
  const regex = new RegExp(regexString, 'iu');
  return regex.test(textRecognize.toLowerCase())
}

const getDocumentTile = (data) => {
  return analysis(() => {
    let index = 2;
    let text = ""
    let accuracies = []
    while (true) {
      const potentialDN = data[index];
      if (potentialDN == null) {
        break;
      }
      text += `${potentialDN.text}\n`;
      accuracies.push(parseFloat(potentialDN.prob))
      index++
    }
    const sum = accuracies.reduce((total, num) => total + num, 0);
    const avg = sum / accuracies.length
    return {
      text: 'Tiêu đề',
      data: text,
      accuracy: NP.round(avg, 4) * 100
    }
  })
}

const getRecipes = (data) => {
  return analysis(() => {
    const potentialIndex = calculatePotentialRecipeIndex(data)
    const pageData = data[`page_${potentialIndex.page}`]
    let footerIndex = potentialIndex.footerIndex + 1
    let text = ""
    let accuracies = []
    while (true) {
      const indexData = pageData['footer_left'][footerIndex]
      if (indexData == null) {
        break;
      }
      text += `${indexData.text}\n`
      accuracies.push(parseFloat(indexData.prob))
      footerIndex++
    }
    const sum = accuracies.reduce((total, num) => total + num, 0);
    const avg = sum / accuracies.length
    return {
      text: 'Nơi nhận',
      data: text,
      accuracy: round(avg * 100)
    }
  })
}

const calculatePotentialRecipeIndex = (data) => {
  const pageCount = data.page_count;
  let index = 1;
  while (true) {
    if (index > pageCount) {
      break;
    }
    const pageData = data[`page_${index}`]
    const leftFooter = pageData['footer_left']
    let footerIndex = 1;
    while (true) {
      const indexData = leftFooter[footerIndex]
      if (indexData == null) {
        break;
      }
      if (matcher('Nơi nhận', indexData.text)) {
        return {
          page: index,
          footerIndex: footerIndex
        }
      }
      footerIndex++;
    }
    index++;
  }
}

const calculateSignUnit = (data) => {
  return analysis(() => {
    const potentialIndex = calculatePotentialSignUnitIndex(data);
    const pageData = data[`page_${potentialIndex.page}`]['footer_right']
    const numberOfFields = Object.keys(pageData).length;
    const signer = {
      text: 'Người Ký',
      data: pageData[numberOfFields].text,
      accuracy: round(parseFloat(pageData[numberOfFields].prob) * 100)
    }
    const signerUnit = {
      text: 'Đơn Vị Ký',
      data: pageData[1].text,
      accuracy: round(parseFloat(pageData[1].prob) * 100)
    }
    const position = {
      text: 'Chức Danh',
      data: pageData[2].text,
      accuracy: round(parseFloat(pageData[2].prob) * 100)
    }
    return [signer, signerUnit, position]
  })
}

const round = (data) => {
  console.log(data)
  return NP.round(data, 4)
}

const calculatePotentialSignUnitIndex = (data) => {
  const pageCount = data.page_count;
  let index = 1;
  while (true) {
    if (index > pageCount) {
      break;
    }
    const pageData = data[`page_${index}`]
    const leftFooter = pageData['footer_right']
    let footerIndex = 1;
    while (true) {
      const indexData = leftFooter[footerIndex]
      if (indexData == null) {
        break;
      }
      if (indexData.text) {
        return {
          page: index,
          footerIndex: footerIndex
        }
      }
      footerIndex++;
    }
    index++;
  }
}
const onNewFileAdded = () => {
  selectedFile.value = [selectedFile.value[selectedFile.value.length - 1]]
  pdfViewerUrl.value = URL.createObjectURL(selectedFile.value[0])
  successProcess.value = false
}

const onRemoveFile = () => {
}


</script>
<template>
  <div>
    <recognize-layout>
      <va-card class="col-span-12">
        <va-card-title>Try with your document</va-card-title>
        <va-card-content>
          <form>
            <div class="grid grid-cols-12 gap-10">
              <div class="flex md:col-span-6 col-span-12">
                <va-select
                    :disabled="successProcess"
                    v-model="selectedType"
                    :options="optionTypes"
                    aria-required="true"
                    class="mb-6"
                    label="Type"
                    placeholder="Select your document type"

                />
              </div>
              <div class="md:col-span-6 col-span-12">
                <va-file-upload
                    :disabled="successProcess"
                    v-model="selectedFile"
                    class="file-type"
                    file-types="application/pdf"
                    @fileAdded="onNewFileAdded"
                    @fileRemoved="onRemoveFile"/>

              </div>
            </div>
            <div class="grid grid-cols-12 mt-2">
              <div class="flex col-span-12 justify-items-center	justify-center">
                <va-button
                    v-if="!successProcess"
                    class="mr-6 mb-2"
                    :loading="loadingProcess"
                    gradient
                    @click="processing">
                  Process
                </va-button>
                <va-button
                    v-if="successProcess"
                    :loading="loadingProcess"
                    class="mr-6 mb-2"
                    color="warning"
                    gradient
                    @click="onReset">
                  Reset
                </va-button>
              </div>
            </div>
          </form>
        </va-card-content>
      </va-card>
      <div v-if="successProcess" class="mt-10 grid grid-cols-12 items-start gap-6 wrap">
        <va-card class="col-span-12 sm:col-span-6" stripe
                 stripe-color="success">
          <va-card-title>File Data</va-card-title>
          <va-scroll-container
              class="max-h-40rem"
              vertical>
            <va-card-content >
              <iframe :src="pdfViewerUrl" class="file-pdf-viewer">
                Oops! an error has occurred.
              </iframe>
            </va-card-content>80
          </va-scroll-container>
        </va-card>

        <va-card class="col-span-12 sm:col-span-6" stripe
                 stripe-color="warning">
          <va-card-title>
            Analysis Data
          </va-card-title>
          <va-scroll-container
              class="max-h-40rem"
              vertical
          >
          <va-card-content v-for="(item, i) in result" :key="i">
            <div v-if="item.data" class="flex flex-row my-2">
              <div class="basis-1/4 text-start">
                <label class="block font-bold leading-6 text-gray-900">
                  {{ item.text }}
                </label>
              </div>
              <div class="basis-1/2 text-start">
                <label class="block text-md leading-6 multiline-label">{{ item.data }}</label>
              </div>
              <div class="basis-1/4 text-md font-bold text-end">{{ item.accuracy }}%</div>
            </div>
          </va-card-content>
          </va-scroll-container>
        </va-card>
      </div>
    </recognize-layout>

  </div>
</template>

<style lang="scss">

.max-h-40rem {
  max-height: 40rem;
}

.multiline-label {
  white-space: pre-line;
}

.file-type {
  --va-file-upload-margin: 0
}

/* Small screens */
@media (max-width: 640px) {
  .file-pdf-viewer {
    width: 100%;
    min-height: 80vmax;
    border: none;
  }
}

/* Medium screens */
@media (min-width: 641px) and (max-width: 1024px) {
  .file-pdf-viewer {
    width: 100%;
    min-height: 60vmax;
    border: none;
  }
}

/* Large screens */
@media (min-width: 1025px) {
  .file-pdf-viewer {
    width: 100%;
    min-height: 40vmax;
    border: none;
  }
}

</style>