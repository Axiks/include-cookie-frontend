import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Callout, Text } from '@radix-ui/themes'


export default function OpenForColabWidget({matchedSkils: matchedSkils}: { matchedSkils: string[] }){
  var skilsStr: string = ""

  matchedSkils.forEach((value, index) => {
    if(matchedSkils.length == 1) {
      skilsStr += value
    } 
    else{
      if(index != 0) skilsStr += value
      else skilsStr += value + ", "
    }
  })

  return(
      <Callout.Root>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Проект відкритий для нових творців. { matchedSkils.length > 0 ? <Text>Твої навички частково підходять ({ skilsStr })</Text> : null }
        </Callout.Text>
      </Callout.Root>
  )
}