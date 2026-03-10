'use client';

import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/form/InputField";
import SelectField from "@/components/form/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import {CountrySelectField} from "@/components/form/CountrySelectField";
import FooterLink from "@/components/form/FooterLink";
const SignUp = () => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName:'',
            email:'',
            password:'',
            country:'India',
            investmentGoals:'Growth',
            riskTolerance:'Medium',
            preferredIndustry:'Technology'
        },
        mode: "onBlur"
    },);


    const onSubmit:(data:any)=> Promise<void> =async (data:SignUpFormData)=> {}
    return (
        <>
            <h1 className="form-title">Sign Up & Personalise</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                <InputField
                    name= "full name"
                    label="Full Name"
                    placeholder="Vampire AT"
                    register={register}
                    error={errors.fullName}
                    validation={{required:'true', minLength:2}}
                />
                <InputField
                    name= "email"
                    label="Email"
                    placeholder="Enter your email"
                    register={register}
                    error={errors.email}
                    validation={{required:'Email name is required', pattern: /^\w+@\w+$/, message:'Email address is required'}}
                />
                <InputField
                    name= "password"
                    label="Password"
                    placeholder="Enter a strong password"
                    register={register}
                    error={errors.password}
                    validation={{required:'Password is reqired', minLength:8}}
                />
                <CountrySelectField name="country" label="Country" control={control} error={errors.country}
                />
                <SelectField
                    name="investmentGoals"
                    label="Investment Goal"
                    placeholder="Select your investment Goal"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />
                <SelectField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    placeholder="Select your risk level"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />
                <SelectField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    placeholder="Select your preferred industry"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Creating Account' : 'Start Your Investing Journey'}

                </Button>

                <FooterLink text="Already have an Account" linkText="Sign in" href="/sign-in" />

            </form>
        </>
    )
}
export default SignUp
